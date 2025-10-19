"""
数据库模型 - 购买记录表
Purchase record table model for SmartStore system
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from .base import Base
import enum


class PurchaseStatus(enum.Enum):
    """购买状态枚举"""
    PENDING = "待支付"
    PAID = "已支付"
    CANCELLED = "已取消"
    REFUNDED = "已退款"


class PurchaseRecord(Base):
    """购买记录表模型"""
    __tablename__ = 'purchase_records'
    
    id = Column(Integer, primary_key=True, autoincrement=True, comment='记录ID')
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, comment='用户ID')
    commodity_id = Column(Integer, ForeignKey('commodities.id'), nullable=False, comment='商品ID')
    quantity = Column(Integer, nullable=False, comment='购买数量')
    unit_price = Column(Float, nullable=False, comment='单价')
    total_price = Column(Float, nullable=False, comment='总价')
    status = Column(Enum(PurchaseStatus), default=PurchaseStatus.PENDING, comment='购买状态')
    transaction_id = Column(Integer, ForeignKey('transactions.id'), nullable=True, comment='关联交易ID')
    purchased_at = Column(DateTime, default=datetime.now, comment='购买时间')
    
    # 关联关系
    user = relationship('User', back_populates='purchase_records')
    commodity = relationship('Commodity', back_populates='purchase_records')
    transaction = relationship('Transaction', back_populates='purchase_records')
    
    def __repr__(self):
        return f"<PurchaseRecord(id={self.id}, user_id={self.user_id}, commodity_id={self.commodity_id}, quantity={self.quantity})>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'commodity_id': self.commodity_id,
            'quantity': self.quantity,
            'unit_price': self.unit_price,
            'total_price': self.total_price,
            'status': self.status.value,
            'transaction_id': self.transaction_id,
            'purchased_at': self.purchased_at.strftime('%Y-%m-%d %H:%M:%S')
        }
