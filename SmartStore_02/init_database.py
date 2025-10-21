"""
SmartStore 数据库初始化脚本
- 自动创建数据库
- 自动创建所有表
- 自动添加测试数据
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

import pymysql
from data_layer.database.db_connector import get_db_connector
from data_layer.database.models import (
    User, UserRole, Commodity, Transaction, 
    TransactionStatus, PaymentMethod, PurchaseRecord, PurchaseStatus
)
from datetime import datetime, timedelta
import random
import uuid
from common.utils.logger import get_logger

logger = get_logger(__name__)


def create_database():
    """创建数据库"""
    try:
        db_host = os.getenv('DB_HOST', 'localhost')
        db_port = int(os.getenv('DB_PORT', 3306))
        db_user = os.getenv('DB_USER', 'root')
        db_password = os.getenv('DB_PASSWORD', '')
        db_name = os.getenv('DB_NAME', 'smartstore')
        
        # 连接 MySQL（不指定数据库）
        connection = pymysql.connect(
            host=db_host,
            port=db_port,
            user=db_user,
            password=db_password,
            charset='utf8mb4'
        )
        
        with connection.cursor() as cursor:
            # 检查数据库是否存在
            cursor.execute(f"SHOW DATABASES LIKE '{db_name}'")
            exists = cursor.fetchone()
            
            if exists:
                logger.info(f"数据库 '{db_name}' 已存在")
            else:
                # 创建数据库
                cursor.execute(
                    f"CREATE DATABASE {db_name} "
                    f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
                )
                logger.info(f"✅ 数据库 '{db_name}' 创建成功")
        
        connection.close()
        return True
        
    except Exception as e:
        logger.error(f"创建数据库失败: {str(e)}")
        return False


def create_tables():
    """创建所有表"""
    try:
        db = get_db_connector()
        db.connect()
        
        # 创建所有表
        from data_layer.database.models.base import Base
        from sqlalchemy import create_engine
        
        db_url = f"mysql+pymysql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@" \
                 f"{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}" \
                 f"?charset=utf8mb4"
        
        engine = create_engine(db_url, echo=False)
        Base.metadata.create_all(engine)
        
        logger.info("✅ 数据库表创建成功")
        return True
        
    except Exception as e:
        logger.error(f"创建表失败: {str(e)}")
        return False


def add_test_data():
    """添加测试数据"""
    try:
        db = get_db_connector()
        db.connect()
        
        with db.session_scope() as session:
            # 检查是否已有数据
            existing_count = session.query(Commodity).count()
            if existing_count > 0:
                logger.warning(f"数据库中已有 {existing_count} 个商品，跳过添加测试数据")
                return True
            
            # 1. 添加测试商品
            logger.info("正在添加测试商品...")
            commodities_data = [
                # 饮料类
                {"name": "可口可乐", "category": "饮料", "price": 3.5, "stock": 50, "location": "A1-01"},
                {"name": "百事可乐", "category": "饮料", "price": 3.5, "stock": 45, "location": "A1-02"},
                {"name": "雪碧", "category": "饮料", "price": 3.0, "stock": 40, "location": "A1-03"},
                {"name": "芬达", "category": "饮料", "price": 3.0, "stock": 35, "location": "A1-04"},
                {"name": "农夫山泉", "category": "饮料", "price": 2.0, "stock": 100, "location": "A2-01"},
                {"name": "怡宝纯净水", "category": "饮料", "price": 2.0, "stock": 80, "location": "A2-02"},
                {"name": "脉动(青柠味)", "category": "饮料", "price": 4.5, "stock": 30, "location": "A2-03"},
                {"name": "红牛", "category": "饮料", "price": 6.0, "stock": 25, "location": "A2-04"},
                # 零食类
                {"name": "乐事薯片(原味)", "category": "零食", "price": 6.5, "stock": 30, "location": "B1-01"},
                {"name": "乐事薯片(番茄味)", "category": "零食", "price": 6.5, "stock": 25, "location": "B1-02"},
                {"name": "乐事薯片(黄瓜味)", "category": "零食", "price": 6.5, "stock": 20, "location": "B1-03"},
                {"name": "奥利奥饼干", "category": "零食", "price": 8.0, "stock": 20, "location": "B2-01"},
                {"name": "德芙巧克力", "category": "零食", "price": 12.0, "stock": 15, "location": "B2-02"},
                {"name": "旺旺仙贝", "category": "零食", "price": 5.0, "stock": 8, "location": "B3-01"},
                {"name": "三只松鼠坚果", "category": "零食", "price": 15.0, "stock": 5, "location": "B3-02"},
                {"name": "好丽友派", "category": "零食", "price": 4.0, "stock": 12, "location": "B3-03"},
                # 速食类
                {"name": "康师傅红烧牛肉面", "category": "速食", "price": 4.5, "stock": 40, "location": "C1-01"},
                {"name": "统一老坛酸菜面", "category": "速食", "price": 4.5, "stock": 35, "location": "C1-02"},
                {"name": "今麦郎大辣娇", "category": "速食", "price": 4.0, "stock": 30, "location": "C1-03"},
                {"name": "三全水饺", "category": "速食", "price": 18.0, "stock": 12, "location": "C2-01"},
                {"name": "思念汤圆", "category": "速食", "price": 16.0, "stock": 10, "location": "C2-02"},
            ]
            
            for item in commodities_data:
                commodity = Commodity(**item)
                session.add(commodity)
            
            session.flush()
            logger.info(f"✅ 成功添加 {len(commodities_data)} 个测试商品")
            
            # 2. 检查是否有用户，如果有则添加交易记录
            users = session.query(User).all()
            if users:
                logger.info(f"找到 {len(users)} 个用户，正在添加测试交易记录...")
                
                # 获取所有商品
                commodities = session.query(Commodity).all()
                
                # 生成过去7天的随机交易
                for i in range(30):
                    days_ago = random.randint(0, 7)
                    hours_ago = random.randint(0, 23)
                    user = random.choice(users)
                    
                    # 随机选择1-5个商品
                    num_items = random.randint(1, 5)
                    selected_items = random.sample(commodities, num_items)
                    
                    # 计算总金额
                    total_amount = sum(item.price * random.randint(1, 3) for item in selected_items)
                    
                    # 创建交易
                    transaction = Transaction(
                        user_id=user.id,
                        transaction_no=f"T{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:8].upper()}",
                        total_amount=total_amount,
                        payment_method=random.choice([PaymentMethod.FACE, PaymentMethod.QRCODE, PaymentMethod.CASH]),
                        status=TransactionStatus.SUCCESS,
                        created_at=datetime.now() - timedelta(days=days_ago, hours=hours_ago)
                    )
                    session.add(transaction)
                    session.flush()
                    
                    # 创建购买记录
                    for item in selected_items:
                        quantity = random.randint(1, 3)
                        purchase_record = PurchaseRecord(
                            user_id=user.id,
                            commodity_id=item.id,
                            quantity=quantity,
                            unit_price=item.price,
                            total_price=item.price * quantity,
                            transaction_id=transaction.id,
                            status=PurchaseStatus.COMPLETED
                        )
                        session.add(purchase_record)
                
                logger.info(f"✅ 成功添加 30 条测试交易记录")
            else:
                logger.info("未找到用户，跳过添加交易记录")
        
        return True
        
    except Exception as e:
        logger.error(f"添加测试数据失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """主函数"""
    print("=" * 60)
    print("SmartStore 数据库初始化")
    print("=" * 60)
    print()
    
    # 步骤1: 创建数据库
    print("步骤 1/3: 创建数据库...")
    if not create_database():
        print("❌ 数据库创建失败，请检查 MySQL 连接配置")
        return
    print()
    
    # 步骤2: 创建表
    print("步骤 2/3: 创建数据库表...")
    if not create_tables():
        print("❌ 数据库表创建失败")
        return
    print()
    
    # 步骤3: 添加测试数据
    print("步骤 3/3: 添加测试数据...")
    if not add_test_data():
        print("❌ 测试数据添加失败")
        return
    print()
    
    print("=" * 60)
    print("✅ 数据库初始化完成！")
    print("=" * 60)
    print()
    print("您现在可以:")
    print("  1. 启动应用: python run.py  或  start.bat")
    print("  2. 访问主页: http://127.0.0.1:5000")
    print("  3. 访问管理后台: http://127.0.0.1:5000/admin")
    print()


if __name__ == '__main__':
    main()
