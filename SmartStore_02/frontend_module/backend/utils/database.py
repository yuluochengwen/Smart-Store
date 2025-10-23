"""
数据库连接工具
提供数据库连接、查询、操作等功能
"""

import sqlite3
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional, Union

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseManager:
    """数据库管理器"""
    
    def __init__(self, db_path: str = "smart_shop.db"):
        """初始化数据库管理器"""
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """初始化数据库"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # 创建用户表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT DEFAULT '普通用户',
                    status TEXT DEFAULT 'active',
                    avatar TEXT DEFAULT '',
                    phone TEXT DEFAULT '',
                    remark TEXT DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP
                )
            ''')
            
            # 创建商品表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS products (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    price REAL NOT NULL,
                    category TEXT NOT NULL,
                    stock INTEGER DEFAULT 0,
                    status TEXT DEFAULT 'active',
                    icon TEXT DEFAULT '',
                    unit TEXT DEFAULT '个',
                    barcode TEXT DEFAULT '',
                    description TEXT DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # 创建订单表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS orders (
                    id TEXT PRIMARY KEY,
                    customer_name TEXT NOT NULL,
                    customer_phone TEXT DEFAULT '',
                    customer_address TEXT DEFAULT '',
                    amount REAL NOT NULL,
                    status TEXT DEFAULT 'unpaid',
                    payment_method TEXT DEFAULT '',
                    payment_time TIMESTAMP,
                    transaction_id TEXT DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # 创建订单商品表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS order_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    order_id TEXT NOT NULL,
                    product_id INTEGER NOT NULL,
                    product_name TEXT NOT NULL,
                    price REAL NOT NULL,
                    quantity INTEGER NOT NULL,
                    subtotal REAL NOT NULL,
                    FOREIGN KEY (order_id) REFERENCES orders(id),
                    FOREIGN KEY (product_id) REFERENCES products(id)
                )
            ''')
            
            # 创建库存记录表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS inventory_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_id INTEGER NOT NULL,
                    product_name TEXT NOT NULL,
                    type TEXT NOT NULL, -- 'in', 'out', 'adjust'
                    quantity INTEGER NOT NULL,
                    old_stock INTEGER NOT NULL,
                    new_stock INTEGER NOT NULL,
                    reason TEXT DEFAULT '',
                    operator_id INTEGER,
                    operator_name TEXT DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (product_id) REFERENCES products(id)
                )
            ''')
            
            # 创建人流量记录表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS traffic_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_type TEXT NOT NULL, -- 'enter', 'leave'
                    person_count INTEGER DEFAULT 1,
                    confidence REAL DEFAULT 0.0,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # 创建系统日志表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS system_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    level TEXT NOT NULL,
                    module TEXT NOT NULL,
                    message TEXT NOT NULL,
                    details TEXT DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # 创建AI识别记录表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS detection_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_id INTEGER,
                    product_name TEXT,
                    confidence REAL,
                    image_path TEXT DEFAULT '',
                    status TEXT DEFAULT 'success', -- 'success', 'failed'
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.commit()
            conn.close()
            
            logger.info("数据库初始化完成")
            
        except Exception as e:
            logger.error(f"数据库初始化失败: {e}")
            raise
    
    def get_connection(self) -> sqlite3.Connection:
        """获取数据库连接"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # 使查询结果可以像字典一样访问
        return conn
    
    def execute_query(self, query: str, params: tuple = None) -> List[Dict[str, Any]]:
        """执行查询语句"""
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            results = [dict(row) for row in cursor.fetchall()]
            return results
            
        except Exception as e:
            logger.error(f"查询执行失败: {e}")
            raise
        finally:
            conn.close()
    
    def execute_update(self, query: str, params: tuple = None) -> int:
        """执行更新语句"""
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            conn.commit()
            return cursor.rowcount
            
        except Exception as e:
            logger.error(f"更新执行失败: {e}")
            conn.rollback()
            raise
        finally:
            conn.close()
    
    def insert_data(self, table: str, data: Dict[str, Any]) -> int:
        """插入数据"""
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            
            columns = ', '.join(data.keys())
            placeholders = ', '.join(['?' for _ in data.keys()])
            values = tuple(data.values())
            
            query = f"INSERT INTO {table} ({columns}) VALUES ({placeholders})"
            cursor.execute(query, values)
            
            conn.commit()
            return cursor.lastrowid
            
        except Exception as e:
            logger.error(f"数据插入失败: {e}")
            conn.rollback()
            raise
        finally:
            conn.close()
    
    def update_data(self, table: str, data: Dict[str, Any], where: str, where_params: tuple = None) -> int:
        """更新数据"""
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            
            set_clause = ', '.join([f"{k} = ?" for k in data.keys()])
            values = tuple(data.values())
            
            if where_params:
                values += where_params
            
            query = f"UPDATE {table} SET {set_clause} WHERE {where}"
            cursor.execute(query, values)
            
            conn.commit()
            return cursor.rowcount
            
        except Exception as e:
            logger.error(f"数据更新失败: {e}")
            conn.rollback()
            raise
        finally:
            conn.close()
    
    def delete_data(self, table: str, where: str, where_params: tuple = None) -> int:
        """删除数据"""
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            
            query = f"DELETE FROM {table} WHERE {where}"
            if where_params:
                cursor.execute(query, where_params)
            else:
                cursor.execute(query)
            
            conn.commit()
            return cursor.rowcount
            
        except Exception as e:
            logger.error(f"数据删除失败: {e}")
            conn.rollback()
            raise
        finally:
            conn.close()

# 数据库管理器实例
db_manager = DatabaseManager()

def get_db_stats():
    """获取数据库统计信息"""
    try:
        stats = {}
        
        # 用户统计
        result = db_manager.execute_query("SELECT COUNT(*) as count FROM users")
        stats['total_users'] = result[0]['count'] if result else 0
        
        # 商品统计
        result = db_manager.execute_query("SELECT COUNT(*) as count FROM products")
        stats['total_products'] = result[0]['count'] if result else 0
        
        # 订单统计
        result = db_manager.execute_query("SELECT COUNT(*) as count FROM orders")
        stats['total_orders'] = result[0]['count'] if result else 0
        
        # 今日订单统计
        today = datetime.now().strftime('%Y-%m-%d')
        result = db_manager.execute_query(
            "SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = ?",
            (today,)
        )
        stats['today_orders'] = result[0]['count'] if result else 0
        
        # 今日收入统计
        result = db_manager.execute_query(
            "SELECT SUM(amount) as total FROM orders WHERE DATE(created_at) = ? AND status = 'paid'",
            (today,)
        )
        stats['today_revenue'] = result[0]['total'] if result and result[0]['total'] else 0
        
        return stats
        
    except Exception as e:
        logger.error(f"获取数据库统计信息失败: {e}")
        return {}

def backup_database(backup_dir: str = "backups"):
    """备份数据库"""
    try:
        # 创建备份目录
        backup_path = Path(backup_dir)
        backup_path.mkdir(exist_ok=True)
        
        # 生成备份文件名
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = backup_path / f"smart_shop_backup_{timestamp}.db"
        
        # 执行备份
        import shutil
        shutil.copy2(db_manager.db_path, backup_file)
        
        logger.info(f"数据库备份完成: {backup_file}")
        return str(backup_file)
        
    except Exception as e:
        logger.error(f"数据库备份失败: {e}")
        raise

def restore_database(backup_file: str):
    """恢复数据库"""
    try:
        backup_path = Path(backup_file)
        if not backup_path.exists():
            raise FileNotFoundError(f"备份文件不存在: {backup_file}")
        
        # 备份当前数据库
        current_backup = backup_database("backups/pre_restore")
        
        # 恢复数据库
        import shutil
        shutil.copy2(backup_file, db_manager.db_path)
        
        logger.info(f"数据库恢复完成，原数据库备份在: {current_backup}")
        
    except Exception as e:
        logger.error(f"数据库恢复失败: {e}")
        raise

def log_system_event(level: str, module: str, message: str, details: str = ""):
    """记录系统日志"""
    try:
        db_manager.insert_data('system_logs', {
            'level': level,
            'module': module,
            'message': message,
            'details': details
        })
    except Exception as e:
        logger.error(f"记录系统日志失败: {e}")

# 导出函数和类
__all__ = [
    'DatabaseManager',
    'db_manager',
    'get_db_stats',
    'backup_database',
    'restore_database',
    'log_system_event'
]