#!/usr/bin/env python3
"""
智能购物系统启动脚本
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path

def check_python_version():
    """检查Python版本"""
    if sys.version_info < (3, 6):
        print("错误: 需要Python 3.6或更高版本")
        print(f"当前版本: {sys.version}")
        sys.exit(1)
    
    print(f"✓ Python版本检查通过: {sys.version.split()[0]}")

def check_dependencies():
    """检查依赖包"""
    required_packages = [
        'flask',
        'flask-cors',
        'requests'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✓ {package} 已安装")
        except ImportError:
            missing_packages.append(package)
            print(f"✗ {package} 未安装")
    
    if missing_packages:
        print(f"\n发现 {len(missing_packages)} 个缺失的依赖包:")
        for package in missing_packages:
            print(f"  - {package}")
        
        print("\n安装命令:")
        print(f"  pip install {' '.join(missing_packages)}")
        
        choice = input("\n是否自动安装缺失的包? (y/n): ")
        if choice.lower() == 'y':
            for package in missing_packages:
                print(f"正在安装 {package}...")
                subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
            print("✓ 所有依赖包安装完成")
        else:
            sys.exit(1)

def setup_environment():
    """设置环境"""
    # 创建必要的目录
    directories = [
        'uploads',
        'logs',
        'data'
    ]
    
    for directory in directories:
        path = Path(directory)
        if not path.exists():
            path.mkdir(parents=True, exist_ok=True)
            print(f"✓ 创建目录: {directory}")
        else:
            print(f"✓ 目录已存在: {directory}")

def generate_requirements():
    """生成requirements.txt"""
    requirements = """# 智能购物系统依赖包
Flask==2.3.2
Flask-CORS==4.0.0
requests==2.31.0
Werkzeug==2.3.6
Jinja2==3.1.2
MarkupSafe==2.1.3
itsdangerous==2.1.2
click==8.1.7
"""
    
    with open('requirements.txt', 'w', encoding='utf-8') as f:
        f.write(requirements)
    
    print("✓ requirements.txt 已生成")

def create_config():
    """创建配置文件"""
    config_content = """# 智能购物系统配置文件

# Flask配置
SECRET_KEY = 'your-secret-key-here-change-in-production'
DEBUG = True
PORT = 5000
HOST = '0.0.0.0'

# 数据库配置
DATABASE_URL = 'sqlite:///smart_shop.db'

# 上传配置
UPLOAD_FOLDER = 'uploads'
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB

# AI配置
AI_MODEL_PATH = 'models/yolov8.pt'
CONFIDENCE_THRESHOLD = 0.7

# 摄像头配置
CAMERA_WIDTH = 1280
CAMERA_HEIGHT = 720
FPS = 30

# 日志配置
LOG_LEVEL = 'INFO'
LOG_FILE = 'logs/app.log'

# 其他配置
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
SESSION_TIMEOUT = 3600  # 1小时
"""
    
    with open('config.py', 'w', encoding='utf-8') as f:
        f.write(config_content)
    
    print("✓ config.py 已生成")

def start_server(args):
    """启动服务器"""
    print("\n" + "="*50)
    print("启动智能购物系统")
    print("="*50)
    
    try:
        # 导入Flask应用
        from app import app
        
        # 设置配置
        app.config['DEBUG'] = args.debug
        app.config['SECRET_KEY'] = 'dev-key-change-in-production'
        
        print(f"\n服务器配置:")
        print(f"  主机: {args.host}")
        print(f"  端口: {args.port}")
        print(f"  调试模式: {args.debug}")
        print(f"  自动重载: {args.reload}")
        
        print(f"\n系统访问地址:")
        print(f"  客户端: http://{args.host}:{args.port}/client")
        print(f"  管理后台: http://{args.host}:{args.port}/admin")
        print(f"  API文档: http://{args.host}:{args.port}/api")
        
        print("\n按 Ctrl+C 停止服务器\n")
        
        # 启动应用
        app.run(
            host=args.host,
            port=args.port,
            debug=args.debug,
            use_reloader=args.reload,
            threaded=True
        )
        
    except ImportError as e:
        print(f"错误: 无法导入Flask应用 - {e}")
        print("请确保已安装所有依赖包")
        sys.exit(1)
    except Exception as e:
        print(f"启动服务器时发生错误: {e}")
        sys.exit(1)

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='智能购物系统启动脚本')
    parser.add_argument('--host', default='0.0.0.0', help='服务器主机地址')
    parser.add_argument('--port', type=int, default=5000, help='服务器端口')
    parser.add_argument('--debug', action='store_true', help='启用调试模式')
    parser.add_argument('--reload', action='store_true', help='启用自动重载')
    parser.add_argument('--setup-only', action='store_true', help='仅设置环境，不启动服务器')
    parser.add_argument('--check-deps', action='store_true', help='仅检查依赖包')
    
    args = parser.parse_args()
    
    print("智能购物系统启动器")
    print("="*50)
    
    try:
        # 检查Python版本
        check_python_version()
        
        # 检查依赖包
        check_dependencies()
        
        if args.check_deps:
            print("\n✓ 依赖包检查完成")
            return
        
        # 设置环境
        setup_environment()
        
        # 生成配置文件
        generate_requirements()
        create_config()
        
        if args.setup_only:
            print("\n✓ 环境设置完成")
            return
        
        # 启动服务器
        start_server(args)
        
    except KeyboardInterrupt:
        print("\n\n收到中断信号，正在退出...")
        sys.exit(0)
    except Exception as e:
        print(f"\n发生错误: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()