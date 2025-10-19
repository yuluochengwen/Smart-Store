"""
日志工具
Logger utility for SmartStore
使用 Python 标准库 logging 模块
"""
import sys
import logging
from pathlib import Path
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler
from datetime import datetime
from common.config.app_config import AppConfig


def setup_logger():
    """配置全局日志器"""
    # 创建日志目录
    AppConfig.LOGS_DIR.mkdir(parents=True, exist_ok=True)
    
    # 创建根日志器
    logger = logging.getLogger('SmartStore')
    logger.setLevel(logging.DEBUG)
    
    # 清除已有的处理器
    logger.handlers.clear()
    
    # 创建格式化器
    formatter = logging.Formatter(
        '%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # 1. 控制台输出
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, AppConfig.LOG_LEVEL))
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # 2. 所有日志文件（按日期轮转）
    today = datetime.now().strftime('%Y-%m-%d')
    all_log_file = AppConfig.LOGS_DIR / f"smartstore_{today}.log"
    file_handler = logging.FileHandler(
        all_log_file,
        encoding='utf-8',
        mode='a'
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    # 3. 错误日志文件
    error_log_file = AppConfig.LOGS_DIR / f"error_{today}.log"
    error_handler = logging.FileHandler(
        error_log_file,
        encoding='utf-8',
        mode='a'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)
    logger.addHandler(error_handler)
    
    return logger


# 初始化日志器
app_logger = setup_logger()


def get_logger(name: str = None):
    """
    获取日志器
    
    Args:
        name: 模块名称（例如 'customer_detection'）
        
    Returns:
        logger实例
    """
    if name:
        return logging.getLogger(f'SmartStore.{name}')
    return app_logger
