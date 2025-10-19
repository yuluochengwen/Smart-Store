"""
账单生成器
Bill generator for SmartStore
"""
from typing import List, Dict
from datetime import datetime
from data_layer.database.db_connector import db_connector
from data_layer.database.models import PurchaseRecord, Transaction, Commodity
from common.utils.logger import get_logger

logger = get_logger(__name__)


class BillGenerator:
    """账单生成器"""
    
    def __init__(self):
        """初始化账单生成器"""
        logger.info("账单生成器初始化成功")
    
    def generate_bill(self, user_id: int, purchase_record_ids: List[int]) -> Dict:
        """
        生成账单
        
        Args:
            user_id: 用户ID
            purchase_record_ids: 购买记录ID列表
            
        Returns:
            账单字典
        """
        try:
            with db_connector.session_scope() as session:
                # 查询购买记录
                records = session.query(PurchaseRecord).filter(
                    PurchaseRecord.id.in_(purchase_record_ids),
                    PurchaseRecord.user_id == user_id
                ).all()
                
                # 构建账单项
                items = []
                total_amount = 0.0
                
                for record in records:
                    commodity = session.query(Commodity).filter(
                        Commodity.id == record.commodity_id
                    ).first()
                    
                    if commodity:
                        item = {
                            'commodity_id': commodity.id,
                            'name': commodity.name,
                            'quantity': record.quantity,
                            'unit_price': record.unit_price,
                            'total_price': record.total_price
                        }
                        items.append(item)
                        total_amount += record.total_price
                
                # 生成账单
                bill = {
                    'user_id': user_id,
                    'items': items,
                    'total_amount': round(total_amount, 2),
                    'item_count': len(items),
                    'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                }
                
                logger.info(f"账单生成成功: 用户={user_id}, 总额=¥{total_amount:.2f}")
                return bill
                
        except Exception as e:
            logger.error(f"生成账单失败: {str(e)}")
            raise
    
    def generate_bill_from_transaction(self, transaction_id: int) -> Dict:
        """
        从交易记录生成账单
        
        Args:
            transaction_id: 交易ID
            
        Returns:
            账单字典
        """
        try:
            with db_connector.session_scope() as session:
                # 查询交易记录
                transaction = session.query(Transaction).filter(
                    Transaction.id == transaction_id
                ).first()
                
                if not transaction:
                    raise ValueError(f"交易记录不存在: ID={transaction_id}")
                
                # 查询关联的购买记录
                records = session.query(PurchaseRecord).filter(
                    PurchaseRecord.transaction_id == transaction_id
                ).all()
                
                # 构建账单项
                items = []
                for record in records:
                    commodity = session.query(Commodity).filter(
                        Commodity.id == record.commodity_id
                    ).first()
                    
                    if commodity:
                        item = {
                            'commodity_id': commodity.id,
                            'name': commodity.name,
                            'quantity': record.quantity,
                            'unit_price': record.unit_price,
                            'total_price': record.total_price
                        }
                        items.append(item)
                
                # 生成账单
                bill = {
                    'transaction_id': transaction_id,
                    'transaction_no': transaction.transaction_no,
                    'user_id': transaction.user_id,
                    'items': items,
                    'total_amount': transaction.total_amount,
                    'payment_method': transaction.payment_method.value,
                    'status': transaction.status.value,
                    'generated_at': transaction.created_at.strftime('%Y-%m-%d %H:%M:%S')
                }
                
                return bill
                
        except Exception as e:
            logger.error(f"从交易生成账单失败: {str(e)}")
            raise
    
    def format_bill_text(self, bill: Dict) -> str:
        """
        格式化账单为文本
        
        Args:
            bill: 账单字典
            
        Returns:
            格式化的账单文本
        """
        lines = []
        lines.append("=" * 40)
        lines.append("SmartStore 购物账单".center(40))
        lines.append("=" * 40)
        lines.append(f"时间: {bill['generated_at']}")
        lines.append(f"用户ID: {bill['user_id']}")
        
        if 'transaction_no' in bill:
            lines.append(f"流水号: {bill['transaction_no']}")
        
        lines.append("-" * 40)
        lines.append(f"{'商品名称':<20} {'数量':<6} {'单价':<8} {'小计'}")
        lines.append("-" * 40)
        
        for item in bill['items']:
            name = item['name'][:18]  # 限制名称长度
            quantity = item['quantity']
            unit_price = item['unit_price']
            total_price = item['total_price']
            lines.append(f"{name:<20} {quantity:<6} ¥{unit_price:<7.2f} ¥{total_price:.2f}")
        
        lines.append("-" * 40)
        lines.append(f"{'总计:':<34} ¥{bill['total_amount']:.2f}")
        lines.append("=" * 40)
        lines.append("感谢您的光临！".center(40))
        lines.append("=" * 40)
        
        return '\n'.join(lines)
