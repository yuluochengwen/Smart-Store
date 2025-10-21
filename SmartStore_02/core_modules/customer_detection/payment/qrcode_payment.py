"""
二维码支付模块
QR code payment for SmartStore
"""
from typing import Dict
from datetime import datetime
from data_layer.database.db_connector import db_connector
from data_layer.database.models import User, Transaction, PaymentMethod, TransactionStatus
from common.utils.logger import get_logger
from common.exceptions.custom_exceptions import PaymentException, UserNotFoundException

logger = get_logger(__name__)


class QRCodePayment:
    """二维码支付类"""
    
    def __init__(self):
        """初始化二维码支付"""
        logger.info("二维码支付模块初始化成功")
    
    def process_payment(self, user_id: int, amount: float, qr_code: str = None, remark: str = None) -> Dict:
        """
        处理二维码支付
        
        Args:
            user_id: 用户ID
            amount: 支付金额
            qr_code: 二维码内容（可选，实际应用中可能需要解析二维码）
            remark: 备注信息
            
        Returns:
            支付结果字典
        """
        try:
            with db_connector.session_scope() as session:
                # 查询用户
                user = session.query(User).filter(User.id == user_id).first()
                if not user:
                    raise UserNotFoundException(user_id)
                
                # 检查余额
                if user.balance < amount:
                    raise PaymentException(
                        f"余额不足: 当前余额 ¥{user.balance:.2f}, 需支付 ¥{amount:.2f}"
                    )
                
                # 更新用户余额
                user.balance -= amount
                
                # 生成交易流水号
                transaction_no = self._generate_transaction_no()
                
                # 创建交易记录
                transaction = Transaction(
                    user_id=user_id,
                    transaction_no=transaction_no,
                    total_amount=amount,
                    payment_method=PaymentMethod.QRCODE,
                    status=TransactionStatus.SUCCESS,
                    remark=remark or "二维码支付"
                )
                session.add(transaction)
                session.commit()
                
                logger.info(
                    f"二维码支付成功: 用户={user.name}, 金额=¥{amount:.2f}, "
                    f"流水号={transaction_no}"
                )
                
                return {
                    'success': True,
                    'transaction_no': transaction_no,
                    'user_name': user.name,
                    'amount': amount,
                    'balance': user.balance,
                    'payment_time': transaction.created_at.strftime('%Y-%m-%d %H:%M:%S')
                }
                
        except Exception as e:
            logger.error(f"二维码支付失败: {str(e)}")
            raise PaymentException(f"支付处理失败: {str(e)}")
    
    def _generate_transaction_no(self) -> str:
        """
        生成交易流水号
        
        Returns:
            交易流水号
        """
        import random
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        random_num = random.randint(1000, 9999)
        return f"QRCD{timestamp}{random_num}"
    
    def verify_qr_code(self, qr_code: str) -> bool:
        """
        验证二维码有效性
        
        Args:
            qr_code: 二维码内容
            
        Returns:
            是否有效
        """
        # 这里可以实现具体的二维码验证逻辑
        # 例如验证格式、有效期等
        if not qr_code:
            return False
        
        # 简单验证示例
        return len(qr_code) > 0
