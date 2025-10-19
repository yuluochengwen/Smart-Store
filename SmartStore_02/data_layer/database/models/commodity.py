"""
数据库模型 - 商品表
Commodity table model for SmartStore system
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import relationship
from .base import Base


class Commodity(Base):
    """商品表模型"""
    __tablename__ = 'commodities'
    
    id = Column(Integer, primary_key=True, autoincrement=True, comment='商品ID')
    name = Column(String(100), nullable=False, comment='商品名称')
    barcode = Column(String(50), unique=True, nullable=True, comment='商品条码')
    category = Column(String(50), nullable=True, comment='商品类别')
    price = Column(Float, nullable=False, comment='商品价格')
    stock = Column(Integer, default=0, comment='库存数量')
    location = Column(String(50), nullable=True, comment='商品位置（如A区3号货架）')
    description = Column(Text, nullable=True, comment='商品描述')
    image_url = Column(String(255), nullable=True, comment='商品图片URL')
    created_at = Column(DateTime, default=datetime.now, comment='创建时间')
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment='更新时间')
    
    # 关联关系
    purchase_records = relationship('PurchaseRecord', back_populates='commodity')
    
    def __repr__(self):
        return f"<Commodity(id={self.id}, name='{self.name}', price={self.price}, stock={self.stock})>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'name': self.name,
            'barcode': self.barcode,
            'category': self.category,
            'price': self.price,
            'stock': self.stock,
            'location': self.location,
            'description': self.description,
            'image_url': self.image_url,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S')
        }
    
    def is_in_stock(self):
        """检查是否有库存"""
        return self.stock > 0
    
    def update_stock(self, quantity: int):
        """更新库存"""
        self.stock += quantity
        if self.stock < 0:
            raise ValueError(f"库存不足: {self.name} 当前库存 {self.stock}")
