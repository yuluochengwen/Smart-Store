# 应用启动入口（需要修改的部分已标注）
from frontend_module import create_app

app = create_app()

if __name__ == '__main__':
    # TODO: 运行配置 - 生产环境必须修改以下配置
    app.run(
        debug=True,  # 需要修改：生产环境设为False
        host='0.0.0.0',  # 需要修改：生产环境指定实际域名
        port=5000  # 需要修改：生产环境使用80或443端口
    )

# 启动说明：
# 1. 安装依赖：pip install flask flask-sqlalchemy  # 需要修改：添加实际依赖
# 2. 启动命令：python run.py
# 3. 访问地址：http://localhost:5000