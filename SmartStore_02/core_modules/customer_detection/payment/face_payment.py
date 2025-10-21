"""
人脸支付模块
Face payment for SmartStore
"""
from typing import Optional, Dict
import numpy as np
from datetime import datetime
from data_layer.database.db_connector import db_connector
from data_layer.database.models import User, Transaction, PaymentMethod, TransactionStatus
from core_modules.customer_detection.identification.member_verify import MemberVerifier
from common.utils.logger import get_logger
from common.exceptions.custom_exceptions import PaymentException, UserNotFoundException

logger = get_logger(__name__)


class FacePayment:
    """人脸支付类"""
    
    def __init__(self):
        """初始化人脸支付"""
        self.member_verifier = MemberVerifier()
        logger.info("人脸支付模块初始化成功")
    
    def process_payment(self, face_image: np.ndarray, amount: float, remark: str = None) -> Dict:
        """
        处理人脸支付
        
        Args:
            face_image: RGB格式的人脸图像
            amount: 支付金额
            remark: 备注信息
            
        Returns:
            支付结果字典
        """
        # 验证会员身份
        user_info = self.member_verifier.verify_by_face(face_image)
        
        if user_info is None:
            raise PaymentException("人脸识别失败，无法完成支付")
        
        user_id = user_info['id']
        
        # 检查余额
        if user_info['balance'] < amount:
            raise PaymentException(
                f"余额不足: 当前余额 ¥{user_info['balance']:.2f}, 需支付 ¥{amount:.2f}"
            )
        
        # 执行支付
        try:
            with db_connector.session_scope() as session:
                # 更新用户余额
                user = session.query(User).filter(User.id == user_id).first()
                if not user:
                    raise UserNotFoundException(user_id)
                
                user.balance -= amount
                
                # 生成交易流水号
                transaction_no = self._generate_transaction_no()
                
                # 创建交易记录
                transaction = Transaction(
                    user_id=user_id,
                    transaction_no=transaction_no,
                    total_amount=amount,
                    payment_method=PaymentMethod.FACE,
                    status=TransactionStatus.SUCCESS,
                    remark=remark or "人脸支付"
                )
                session.add(transaction)
                session.commit()
                
                logger.info(
                    f"人脸支付成功: 用户={user.name}, 金额=¥{amount:.2f}, "
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
            logger.error(f"人脸支付失败: {str(e)}")
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
        return f"FACE{timestamp}{random_num}"
