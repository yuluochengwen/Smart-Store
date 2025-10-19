"""
数据库模型 - 用户表
User table model for SmartStore system
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum, Float, Text
from sqlalchemy.orm import relationship
from .base import Base
import enum


class UserRole(enum.Enum):
    """用户角色枚举"""
    MEMBER = "会员"
    VIP = "VIP会员"
    GUEST = "游客"


class User(Base):
    """用户表模型"""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True, comment='用户ID')
    name = Column(String(50), nullable=False, comment='用户姓名')
    phone = Column(String(20), unique=True, nullable=True, comment='手机号')
    email = Column(String(100), unique=True, nullable=True, comment='邮箱')
    role = Column(Enum(UserRole), default=UserRole.GUEST, comment='用户角色')
    face_encoding = Column(Text, nullable=True, comment='人脸编码数据')
    balance = Column(Float, default=0.0, comment='账户余额')
    created_at = Column(DateTime, default=datetime.now, comment='创建时间')
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment='更新时间')
    
    # 关联关系
    purchase_records = relationship('PurchaseRecord', back_populates='user', cascade='all, delete-orphan')
    transactions = relationship('Transaction', back_populates='user', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f"<User(id={self.id}, name='{self.name}', role={self.role.value})>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'name': self.name,
            'phone': self.phone,
            'email': self.email,
            'role': self.role.value,
            'balance': self.balance,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S')
        }
