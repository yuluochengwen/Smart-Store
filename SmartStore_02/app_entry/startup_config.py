"""
应用启动配置
系统自检
Startup configuration for SmartStore
"""
import sys
import os
from pathlib import Path
import pymysql

# 添加项目根目录到 Python 路径
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

from common.config.app_config import AppConfig
from common.utils.logger import get_logger
from data_layer.database.db_connector import get_db_connector

logger = get_logger(__name__)


def create_database_if_not_exists():
    """如果数据库不存在则创建"""
    try:
        # 获取数据库配置
        db_host = os.getenv('DB_HOST', 'localhost')
        db_port = int(os.getenv('DB_PORT', 3306))
        db_user = os.getenv('DB_USER', 'root')
        db_password = os.getenv('DB_PASSWORD', '123456')
        db_name = os.getenv('DB_NAME', 'smartstore')
        
        # 连接到 MySQL 服务器（不指定数据库）
        logger.info("检查数据库是否存在...")
        connection = pymysql.connect(
            host=db_host,
            port=db_port,
            user=db_user,
            password=db_password,
            charset='utf8mb4'
        )
        
        try:
            with connection.cursor() as cursor:
                # 检查数据库是否存在
                cursor.execute(f"SHOW DATABASES LIKE '{db_name}'")
                result = cursor.fetchone()
                
                if not result:
                    # 创建数据库
                    logger.info(f"数据库 '{db_name}' 不存在，正在创建...")
                    cursor.execute(
                        f"CREATE DATABASE `{db_name}` "
                        f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
                    )
                    logger.info(f"数据库 '{db_name}' 创建成功")
                else:
                    logger.info(f"数据库 '{db_name}' 已存在")
        finally:
            connection.close()
            
    except Exception as e:
        logger.error(f"创建数据库失败: {str(e)}")
        raise


def init_database():
    """初始化数据库"""
    try:
        # 先确保数据库存在
        create_database_if_not_exists()
        
        # 连接数据库并初始化表
        logger.info("初始化数据库连接...")
        db_conn = get_db_connector()
        db_conn.connect()
        db_conn.init_db()
        logger.info("数据库初始化完成")
    except Exception as e:
        logger.error(f"数据库初始化失败: {str(e)}")
        raise


def init_directories():
    """初始化目录结构"""
    logger.info("检查并创建必要的目录...")
    AppConfig.init_directories()
    logger.info("目录结构初始化完成")


def load_environment():
    """加载环境变量"""
    env_file = Path(__file__).parent.parent / '.env'
    if env_file.exists():
        from dotenv import load_dotenv
        load_dotenv(env_file)
        logger.info("环境变量加载完成")
    else:
        logger.warning(".env文件不存在，使用默认配置")


def init_models():
    """初始化AI模型"""
    logger.info("初始化AI模型...")
    # 这里可以预加载一些模型
    # 例如: YOLO模型、人脸识别模型等
    logger.info("AI模型初始化完成")


def init_app():
    """初始化应用"""
    logger.info("=" * 60)
    logger.info("SmartStore 智能无人商店系统启动")
    logger.info("=" * 60)
    
    # 加载环境变量
    load_environment()
    
    # 初始化目录
    init_directories()
    
    # 初始化数据库
    init_database()
    
    # 初始化模型
    init_models()
    
    logger.info("应用初始化完成")
    logger.info("=" * 60)


def shutdown_app():
    """关闭应用"""
    logger.info("正在关闭应用...")
    
    # 关闭数据库连接
    db_conn = get_db_connector()
    db_conn.close()
    
    logger.info("应用已关闭")
