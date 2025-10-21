"""
SmartStore 项目启动脚本
运行此文件启动整个应用
"""
import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).resolve().parent
sys.path.insert(0, str(project_root))

# 导入主应用
from app_entry.main_app import main

if __name__ == '__main__':
    main()
