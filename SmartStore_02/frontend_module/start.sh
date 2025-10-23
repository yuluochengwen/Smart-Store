#!/bin/bash

# 智能购物系统启动脚本

echo "=================================="
echo "智能购物系统启动器"
echo "=================================="

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "错误: 未找到Python3，请先安装Python3.6+"
    exit 1
fi

PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo "Python版本: $PYTHON_VERSION"

# 检查是否在项目根目录
if [ ! -f "backend/app.py" ]; then
    echo "错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 显示菜单
echo ""
echo "请选择操作:"
echo "1. 安装依赖包"
echo "2. 启动开发服务器"
echo "3. 启动生产服务器"
echo "4. 运行测试"
echo "5. 数据库初始化"
echo "6. 查看日志"
echo "7. 退出"
echo ""

read -p "请输入选项 [1-7]: " choice

case $choice in
    1)
        echo "正在安装依赖包..."
        cd backend
        pip install -r requirements.txt
        if [ $? -eq 0 ]; then
            echo "✓ 依赖包安装成功"
        else
            echo "✗ 依赖包安装失败"
            exit 1
        fi
        ;;
    2)
        echo "正在启动开发服务器..."
        cd backend
        python run.py --host 0.0.0.0 --port 5000 --debug --reload
        ;;
    3)
        echo "正在启动生产服务器..."
        cd backend
        if command -v gunicorn &> /dev/null; then
            gunicorn -w 4 -b 0.0.0.0:5000 app:app
        else
            echo "错误: 未找到gunicorn，请先安装"
            echo "运行: pip install gunicorn"
            exit 1
        fi
        ;;
    4)
        echo "正在运行测试..."
        cd backend
        if command -v pytest &> /dev/null; then
            pytest -v
        else
            echo "错误: 未找到pytest，请先安装"
            echo "运行: pip install pytest"
            exit 1
        fi
        ;;
    5)
        echo "正在初始化数据库..."
        cd backend
        python -c "
from utils.database import db_manager
from utils.camera import init_camera_system
from utils.ai_detection import init_ai_system

print('初始化数据库...')
db_manager.init_database()

print('初始化摄像头系统...')
init_camera_system()

print('初始化AI系统...')
init_ai_system()

print('✓ 数据库初始化完成')
"
        ;;
    6)
        echo "查看日志..."
        if [ -f "backend/logs/app.log" ]; then
            tail -f backend/logs/app.log
        else
            echo "日志文件不存在"
        fi
        ;;
    7)
        echo "退出程序"
        exit 0
        ;;
    *)
        echo "无效选项，请重新运行脚本"
        exit 1
        ;;
esac