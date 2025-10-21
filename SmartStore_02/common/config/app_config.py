"""
应用配置文件
Application configuration for SmartStore
"""
import os
from pathlib import Path


class AppConfig:
    """应用程序配置类"""
    
    # 项目根目录
    BASE_DIR = Path(__file__).resolve().parent.parent.parent
    
    # Flask配置
    SECRET_KEY = os.getenv('SECRET_KEY', 'smartstore-secret-key-2025')
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 5000))
    
    # 数据库配置
    DB_CONFIG = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': int(os.getenv('DB_PORT', 3306)),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', '123456'),
        'database': os.getenv('DB_NAME', 'smartstore'),
        'charset': 'utf8mb4'
    }
    
    # 文件存储路径
    STORAGE_DIR = BASE_DIR / 'data_layer' / 'storage'
    USER_IMAGES_DIR = STORAGE_DIR / 'user_images'
    GENERATED_IMAGES_DIR = STORAGE_DIR / 'generated_images'
    LOGS_DIR = STORAGE_DIR / 'logs'
    
    # 摄像头配置
    CAMERA_CONFIG = {
        'customer_camera_id': 0,  # 顾客检测摄像头ID
        'commodity_camera_id': 1,  # 商品检测摄像头ID
        'fps': 30,
        'resolution': (1280, 720)
    }
    
    # API配置
    API_PREFIX = '/api/v1'
    API_TIMEOUT = 30
    
    # 跨域配置
    CORS_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:5000']
    
    # 日志配置
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FORMAT = "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>"
    LOG_ROTATION = "500 MB"
    LOG_RETENTION = "30 days"
    
    @classmethod
    def init_directories(cls):
        """初始化必要的目录"""
        directories = [
            cls.STORAGE_DIR,
            cls.USER_IMAGES_DIR,
            cls.GENERATED_IMAGES_DIR,
            cls.LOGS_DIR
        ]
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
    
    @classmethod
    def get_db_url(cls):
        """获取数据库连接URL"""
        config = cls.DB_CONFIG
        return (
            f"mysql+pymysql://{config['user']}:{config['password']}"
            f"@{config['host']}:{config['port']}"
            f"/{config['database']}?charset={config['charset']}"
        )


# 初始化配置
AppConfig.init_directories()
