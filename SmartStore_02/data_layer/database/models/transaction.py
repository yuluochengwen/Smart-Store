"""
数据库模型 - 交易流水表
Transaction table model for SmartStore system
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from .base import Base
import enum


class PaymentMethod(enum.Enum):
    """支付方式枚举"""
    FACE = "人脸支付"
    QRCODE = "二维码支付"
    CARD = "刷卡支付"
    CASH = "现金支付"


class TransactionStatus(enum.Enum):
    """交易状态枚举"""
    SUCCESS = "成功"
    FAILED = "失败"
    PENDING = "处理中"
    REFUNDED = "已退款"


class Transaction(Base):
    """交易流水表模型"""
    __tablename__ = 'transactions'
    
    id = Column(Integer, primary_key=True, autoincrement=True, comment='流水ID')
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, comment='用户ID')
    transaction_no = Column(String(50), unique=True, nullable=False, comment='交易流水号')
    total_amount = Column(Float, nullable=False, comment='交易总金额')
    payment_method = Column(Enum(PaymentMethod), nullable=False, comment='支付方式')
    status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDING, comment='交易状态')
    remark = Column(Text, nullable=True, comment='备注')
    created_at = Column(DateTime, default=datetime.now, comment='交易时间')
    
    # 关联关系
    user = relationship('User', back_populates='transactions')
    purchase_records = relationship('PurchaseRecord', back_populates='transaction')
    
    def __repr__(self):
        return f"<Transaction(id={self.id}, transaction_no='{self.transaction_no}', amount={self.total_amount})>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'transaction_no': self.transaction_no,
            'total_amount': self.total_amount,
            'payment_method': self.payment_method.value,
            'status': self.status.value,
            'remark': self.remark,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }
