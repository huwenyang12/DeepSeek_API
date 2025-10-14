import requests
import json

class DeepSeekChat:
    def __init__(self, api_key, model="deepseek-chat"):
        self.api_key = api_key
        self.model = model
        self.conversation_history = []
        self.base_url = "https://api.deepseek.com/v1/chat/completions"
        
    def add_message(self, role, content):
        """添加消息到对话历史"""
        self.conversation_history.append({
            "role": role,
            "content": content
        })
    
    def ask(self, question, stream=False):
        """提问并获取回答"""
        self.add_message("user", question)
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        data = {
            "model": self.model,
            "messages": self.conversation_history,
            "stream": stream
        }
        
        try:
            if stream:
                return self._stream_response(headers, data)
            else:
                return self._get_response(headers, data)
                
        except Exception as e:
            return f"错误: {e}"
    
    def _get_response(self, headers, data):
        """获取完整响应"""
        response = requests.post(self.base_url, headers=headers, json=data)
        response.raise_for_status()
        
        result = response.json()
        answer = result["choices"][0]["message"]["content"]
        
        self.add_message("assistant", answer)
        return answer
    
    def _stream_response(self, headers, data):
        """流式响应"""
        response = requests.post(self.base_url, headers=headers, json=data, stream=True)
        response.raise_for_status()
        
        full_response = ""
        print("DeepSeek: ", end="", flush=True)
        
        for line in response.iter_lines():
            if line:
                line = line.decode('utf-8')
                if line.startswith('data: '):
                    data_str = line[6:]
                    if data_str != '[DONE]':
                        try:
                            data_json = json.loads(data_str)
                            if 'choices' in data_json and len(data_json['choices']) > 0:
                                delta = data_json['choices'][0].get('delta', {})
                                if 'content' in delta:
                                    content = delta['content']
                                    print(content, end="", flush=True)
                                    full_response += content
                        except json.JSONDecodeError:
                            continue
        print()  # 换行
        
        self.add_message("assistant", full_response)
        return full_response
    
    def clear_history(self):
        """清空对话历史"""
        self.conversation_history = []

# 使用示例
if __name__ == "__main__":
    API_KEY = "sk-a0dad831d2134b7dbabd4246da346495"
    
    chat = DeepSeekChat(API_KEY)
    
    # 多轮对话
    questions = [
        "你好，请介绍一下你自己",
        "Python是什么？",
    ]
    
    for i, question in enumerate(questions, 1):
        print(f"\n第{i}轮对话:")
        print(f"问题: {question}")
        answer = chat.ask(question, stream=True)