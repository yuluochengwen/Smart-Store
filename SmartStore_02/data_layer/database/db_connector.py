"""
数据库连接器
Database connector for SmartStore system
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.pool import QueuePool
from contextlib import contextmanager
from common.utils.logger import get_logger

from .models import Base

# 获取数据库模块的日志器
logger = get_logger('database')


class DatabaseConnector:
    """数据库连接管理器"""
    
    def __init__(self, db_config: dict = None):
        """
        初始化数据库连接
        
        Args:
            db_config: 数据库配置字典
        """
        if db_config is None:
            db_config = {
                'host': os.getenv('DB_HOST', 'localhost'),
                'port': int(os.getenv('DB_PORT', 3306)),
                'user': os.getenv('DB_USER', 'root'),
                'password': os.getenv('DB_PASSWORD', ''),
                'database': os.getenv('DB_NAME', 'smartstore'),
                'charset': 'utf8mb4'
            }
        
        self.db_config = db_config
        self.engine = None
        self.session_factory = None
        self.Session = None
        
    def connect(self):
        """建立数据库连接"""
        try:
            # 构建数据库连接字符串
            db_url = (
                f"mysql+pymysql://{self.db_config['user']}:{self.db_config['password']}"
                f"@{self.db_config['host']}:{self.db_config['port']}"
                f"/{self.db_config['database']}?charset={self.db_config['charset']}"
            )
            
            # 创建引擎
            self.engine = create_engine(
                db_url,
                poolclass=QueuePool,
                pool_size=10,
                pool_recycle=3600,
                echo=False  # 设为True可查看SQL语句
            )
            
            # 创建session工厂
            self.session_factory = sessionmaker(bind=self.engine)
            self.Session = scoped_session(self.session_factory)
            
            logger.info(f"数据库连接成功: {self.db_config['host']}:{self.db_config['port']}/{self.db_config['database']}")
            
        except Exception as e:
            logger.error(f"数据库连接失败: {str(e)}")
            raise
    
    def init_db(self):
        """初始化数据库表"""
        try:
            Base.metadata.create_all(self.engine)
            logger.info("数据库表初始化成功")
        except Exception as e:
            logger.error(f"数据库表初始化失败: {str(e)}")
            raise
    
    def drop_all_tables(self):
        """删除所有表（谨慎使用）"""
        try:
            Base.metadata.drop_all(self.engine)
            logger.warning("所有数据库表已删除")
        except Exception as e:
            logger.error(f"删除数据库表失败: {str(e)}")
            raise
    
    def get_session(self):
        """获取数据库session"""
        if self.Session is None:
            raise RuntimeError("数据库未连接，请先调用connect()方法")
        return self.Session()
    
    @contextmanager
    def session_scope(self):
        """
        提供一个事务范围的上下文管理器
        
        用法:
            with db_connector.session_scope() as session:
                user = User(name='test')
                session.add(user)
        """
        session = self.get_session()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"数据库事务失败: {str(e)}")
            raise
        finally:
            session.close()
    
    def close(self):
        """关闭数据库连接"""
        if self.Session:
            self.Session.remove()
        if self.engine:
            self.engine.dispose()
        logger.info("数据库连接已关闭")


# 全局数据库连接器实例（延迟初始化）
db_connector = None


def get_db_connector():
    """获取或创建数据库连接器实例"""
    global db_connector
    if db_connector is None:
        db_connector = DatabaseConnector()
    return db_connector


def get_db_session():
    """获取数据库session的便捷函数"""
    return get_db_connector().get_session()
