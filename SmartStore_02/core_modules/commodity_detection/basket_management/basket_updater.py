"""
购物篮更新器
Basket updater for tracking customer purchases
"""
from typing import List, Dict
from collections import defaultdict
from data_layer.database.db_connector import db_connector
from data_layer.database.models import Commodity, PurchaseRecord, PurchaseStatus
from common.utils.logger import get_logger
from common.exceptions.custom_exceptions import CommodityNotFoundException

logger = get_logger(__name__)


class BasketUpdater:
    """购物篮管理类"""
    
    def __init__(self):
        """初始化购物篮管理器"""
        # 使用字典存储每个用户的购物篮: {user_id: {commodity_id: quantity}}
        self.baskets = defaultdict(lambda: defaultdict(int))
        logger.info("购物篮管理器初始化成功")
    
    def add_item(self, user_id: int, commodity_id: int, quantity: int = 1):
        """
        向购物篮添加商品
        
        Args:
            user_id: 用户ID
            commodity_id: 商品ID
            quantity: 数量
        """
        self.baskets[user_id][commodity_id] += quantity
        logger.info(f"添加商品到购物篮: 用户={user_id}, 商品={commodity_id}, 数量={quantity}")
    
    def remove_item(self, user_id: int, commodity_id: int, quantity: int = 1):
        """
        从购物篮移除商品
        
        Args:
            user_id: 用户ID
            commodity_id: 商品ID
            quantity: 数量
        """
        if user_id in self.baskets:
            if commodity_id in self.baskets[user_id]:
                self.baskets[user_id][commodity_id] -= quantity
                
                # 如果数量为0或负数，移除该商品
                if self.baskets[user_id][commodity_id] <= 0:
                    del self.baskets[user_id][commodity_id]
                    logger.info(f"从购物篮移除商品: 用户={user_id}, 商品={commodity_id}")
                else:
                    logger.info(f"减少商品数量: 用户={user_id}, 商品={commodity_id}, 数量={quantity}")
    
    def get_basket(self, user_id: int) -> Dict[int, int]:
        """
        获取用户的购物篮
        
        Args:
            user_id: 用户ID
            
        Returns:
            购物篮字典 {commodity_id: quantity}
        """
        return dict(self.baskets[user_id])
    
    def get_basket_details(self, user_id: int) -> List[Dict]:
        """
        获取用户购物篮的详细信息
        
        Args:
            user_id: 用户ID
            
        Returns:
            商品详情列表
        """
        basket = self.get_basket(user_id)
        details = []
        
        try:
            with db_connector.session_scope() as session:
                for commodity_id, quantity in basket.items():
                    commodity = session.query(Commodity).filter(
                        Commodity.id == commodity_id
                    ).first()
                    
                    if commodity:
                        details.append({
                            'commodity_id': commodity_id,
                            'name': commodity.name,
                            'quantity': quantity,
                            'unit_price': commodity.price,
                            'total_price': commodity.price * quantity,
                            'location': commodity.location
                        })
                    else:
                        logger.warning(f"商品不存在: ID={commodity_id}")
        
        except Exception as e:
            logger.error(f"获取购物篮详情失败: {str(e)}")
        
        return details
    
    def clear_basket(self, user_id: int):
        """
        清空用户的购物篮
        
        Args:
            user_id: 用户ID
        """
        if user_id in self.baskets:
            self.baskets[user_id].clear()
            logger.info(f"清空购物篮: 用户={user_id}")
    
    def calculate_total(self, user_id: int) -> float:
        """
        计算购物篮总金额
        
        Args:
            user_id: 用户ID
            
        Returns:
            总金额
        """
        basket_details = self.get_basket_details(user_id)
        total = sum(item['total_price'] for item in basket_details)
        return round(total, 2)
    
    def save_to_database(self, user_id: int) -> List[int]:
        """
        将购物篮保存到数据库
        
        Args:
            user_id: 用户ID
            
        Returns:
            购买记录ID列表
        """
        basket = self.get_basket(user_id)
        record_ids = []
        
        try:
            with db_connector.session_scope() as session:
                for commodity_id, quantity in basket.items():
                    commodity = session.query(Commodity).filter(
                        Commodity.id == commodity_id
                    ).first()
                    
                    if not commodity:
                        raise CommodityNotFoundException(commodity_id)
                    
                    # 创建购买记录
                    record = PurchaseRecord(
                        user_id=user_id,
                        commodity_id=commodity_id,
                        quantity=quantity,
                        unit_price=commodity.price,
                        total_price=commodity.price * quantity,
                        status=PurchaseStatus.PENDING
                    )
                    session.add(record)
                    session.flush()  # 获取ID
                    record_ids.append(record.id)
                
                session.commit()
                logger.info(f"购物篮已保存到数据库: 用户={user_id}, 记录数={len(record_ids)}")
        
        except Exception as e:
            logger.error(f"保存购物篮失败: {str(e)}")
            raise
        
        return record_ids
