"""
数据库模型 - 用户反馈与LLM交互记录表
Feedback table model for SmartStore system
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from .base import Base
import enum


class FeedbackType(enum.Enum):
    """反馈类型枚举"""
    QUESTION = "咨询问题"
    COMPLAINT = "投诉建议"
    RECOMMENDATION = "商品推荐"
    CHAT = "闲聊对话"


class Feedback(Base):
    """用户反馈与LLM交互记录表模型"""
    __tablename__ = 'feedbacks'
    
    id = Column(Integer, primary_key=True, autoincrement=True, comment='记录ID')
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True, comment='用户ID（游客可为空）')
    feedback_type = Column(Enum(FeedbackType), default=FeedbackType.QUESTION, comment='反馈类型')
    question = Column(Text, nullable=False, comment='用户问题/输入')
    response = Column(Text, nullable=True, comment='LLM回复')
    session_id = Column(String(100), nullable=True, comment='会话ID（同一次对话）')
    model_name = Column(String(50), nullable=True, comment='使用的模型名称')
    tokens_used = Column(Integer, nullable=True, comment='消耗的token数量')
    response_time = Column(Integer, nullable=True, comment='响应时间（毫秒）')
    rating = Column(Integer, nullable=True, comment='用户评分（1-5星）')
    created_at = Column(DateTime, default=datetime.now, comment='创建时间')
    
    # 关联关系
    user = relationship('User', backref='feedbacks')
    
    def __repr__(self):
        return f"<Feedback(id={self.id}, user_id={self.user_id}, type={self.feedback_type.value})>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'feedback_type': self.feedback_type.value,
            'question': self.question,
            'response': self.response,
            'session_id': self.session_id,
            'model_name': self.model_name,
            'tokens_used': self.tokens_used,
            'response_time': self.response_time,
            'rating': self.rating,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }
