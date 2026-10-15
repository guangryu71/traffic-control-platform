#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简单的Ollama本地模型聊天工具
实现基础输入问题输出回复功能
"""

import requests
import json

# 静态参数定义
DEFAULT_MODEL = "deepseek-r1:8b"
DEFAULT_SYSTEM_PROMPT = "你是一个有用的AI助手，请用中文回答用户的问题。"

def check_ollama_connection():
    """检查Ollama服务是否可用"""
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        return response.status_code == 200
    except requests.exceptions.RequestException:
        return False

def get_available_models():
    """获取可用的模型列表"""
    try:
        response = requests.get("http://localhost:11434/api/tags")
        if response.status_code == 200:
            data = response.json()
            return [model["name"] for model in data.get("models", [])]
        return []
    except Exception as e:
        print(f"获取模型列表失败: {e}")
        return []

def chat_with_model(model_name, prompt, system_prompt=None):
    """与模型进行对话"""
    url = "http://localhost:11434/api/generate"
    
    # 构建请求数据
    data = {
        "model": model_name,
        "prompt": prompt,
        "stream": False
    }
    
    # 添加系统提示（如果有）
    if system_prompt:
        data["system"] = system_prompt
    
    try:
        response = requests.post(url, json=data, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            return result.get("response", "模型没有返回有效回复")
        else:
            return f"请求失败，状态码: {response.status_code}"
            
    except requests.exceptions.Timeout:
        return "请求超时，请检查模型是否正在运行"
    except Exception as e:
        return f"发生错误: {e}"

def main():
    """主函数"""
    print("=" * 50)
    print("Ollama本地模型聊天工具")
    print("=" * 50)
    
    # 检查Ollama服务
    print("正在检查Ollama服务...")
    if not check_ollama_connection():
        print("❌ Ollama服务未启动或不可用")
        print("请先启动Ollama服务:")
        print("1. 打开命令行")
        print("2. 输入: ollama serve")
        print("3. 确保服务在 http://localhost:11434 运行")
        return
    
    print("✅ Ollama服务正常运行")
    
    # 使用默认模型
    selected_model = DEFAULT_MODEL
    print(f"\n使用默认模型: {selected_model}")
    
    # 检查默认模型是否可用
    models = get_available_models()
    if selected_model not in models:
        print(f"⚠️ 默认模型 {selected_model} 未找到")
        if models:
            print("可用的模型:")
            for i, model in enumerate(models, 1):
                print(f"{i}. {model}")
            print(f"\n请先下载默认模型: ollama pull {selected_model}")
        else:
            print("❌ 没有找到可用的模型")
            print("请先安装模型，例如:")
            print("ollama pull deepseek-r1:8b")
        return
    
    print("输入 'quit' 或 '退出' 结束对话")
    print("-" * 50)
    
    # 开始对话循环
    while True:
        # 获取用户输入
        user_input = input("\n💬 请输入您的问题: ").strip()
        
        # 退出条件
        if user_input.lower() in ['quit', '退出', 'exit', 'q']:
            print("👋 再见！")
            break
        
        if not user_input:
            print("⚠️ 输入不能为空，请重新输入")
            continue
        
        # 发送请求并获取回复
        print("\n🤖 正在思考中...")
        response = chat_with_model(selected_model, user_input, DEFAULT_SYSTEM_PROMPT)
        
        # 显示回复
        print("\n📝 模型回复:")
        print("-" * 40)
        print(response)
        print("-" * 40)

if __name__ == "__main__":
    main()