# 自动生成的初始化文件
# Flask应用初始化（需要修改的部分已标注）
from flask import Flask
from .routes.main_routes import main_bp
from .routes.user_routes import user_bp
from .routes.admin_routes import admin_bp

def create_app():
    app = Flask(__name__)
    
    # TODO: 配置修改 - 请替换为实际密钥和数据库配置
    app.config['SECRET_KEY'] = 'your-secret-key-here'  # 需要修改：替换为随机生成的密钥
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///store.db'  # 需要修改：替换为实际数据库URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # 注册蓝图
    app.register_blueprint(main_bp)
    app.register_blueprint(user_bp, url_prefix='/user')
    app.register_blueprint(admin_bp, url_prefix='/admin')
    
    return app

# 应用入口
if __name__ == '__main__':
    app = create_app()
    # TODO: 运行配置 - 生产环境需修改debug=False
    app.run(debug=True, host='0.0.0.0', port=5000)  # 需要修改：生产环境关闭debug模式