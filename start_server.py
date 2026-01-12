#!/usr/bin/env python3
"""
简单的HTTP服务器启动脚本
用于解决浏览器同源策略问题，让diff_viewer.html能够正常加载JSON文件
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

def start_server():
    # 确保在正确的目录
    script_dir = Path(__file__).parent
    os.chdir(script_dir)

    # HTML_PATH = 'pages/daily-simple-report.html'
    HTML_PATH = 'pages/calculate/calculator-hub.html'
    
    # 检查必要文件是否存在
    if not Path(HTML_PATH).exists():
        print(f"❌ 错误: 找不到 {HTML_PATH} 文件")
        return False
        
    # if not Path('shenji_llm/diff_output.json').exists():
    #     print("⚠️  警告: 找不到 shenji_llm/diff_output.json 文件")
    #     print("   页面将提供手动选择文件的选项")
    
    # 设置端口
    PORT = 8001

    # 检查端口是否被占用
    try:
        with socketserver.TCPServer(("", PORT), http.server.SimpleHTTPRequestHandler) as httpd:
            print(f"🚀 启动HTTP服务器...")
            print(f"📂 服务目录: {script_dir}")
            print(f"🌐 访问地址: http://localhost:{PORT}/{HTML_PATH}")
            print(f"⏹️  按 Ctrl+C 停止服务器")
            print("-" * 50)
            
            # 自动打开浏览器
            try:
                webbrowser.open(f'http://localhost:{PORT}/{HTML_PATH}')
                print("🔗 已自动打开浏览器")
            except:
                print("⚠️  无法自动打开浏览器，请手动访问上述地址")
            
            print("-" * 50)
            httpd.serve_forever()
            
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ 端口 {PORT} 已被占用")
            print(f"🔗 请尝试访问: http://localhost:{PORT}/{HTML_PATH}")
            print("   或者终止占用该端口的进程后重试")
            # 关闭进程 bash kill 命令
            print(f"查看进程信息命令：  ps -p $(lsof -t -i:{PORT}) -o pid,ppid,command")
            print(f"关闭进程命令：  kill -9 $(lsof -t -i:{PORT}) ")
        else:
            print(f"❌ 启动服务器失败: {e}")
        return False
    
    return True

if __name__ == "__main__":
    try:
        start_server()
    except KeyboardInterrupt:
        print("\n👋 服务器已停止")
        sys.exit(0)
    except Exception as e:
        print(f"❌ 发生错误: {e}")
        sys.exit(1)
