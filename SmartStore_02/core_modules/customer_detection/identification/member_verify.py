"""
会员验证模块 - 使用 DeepFace + TensorFlow GPU
Member verification and face registration using DeepFace with GPU acceleration
"""
from typing import Optional, Tuple
from pathlib import Path
import cv2
import numpy as np
from sqlalchemy.orm import Session

from .face_recognition import FaceRecognizer
from data_layer.database.db_connector import DatabaseConnector
from data_layer.database.models import User, UserRole
from common.utils.logger import get_logger
from common.exceptions.custom_exceptions import UserNotFoundException

logger = get_logger(__name__)


class MemberVerifier:
    """会员验证器 - 使用DeepFace + GPU加速"""
    
    def __init__(self, model_name: str = 'Facenet'):
        """
        初始化会员验证器
        
        Args:
            model_name: DeepFace模型名称 ('Facenet', 'VGG-Face', 'ArcFace'等)
        """
        self.face_recognizer = FaceRecognizer(model_name=model_name)
        self.db_connector = DatabaseConnector()
        
        # 加载已注册的人脸数据
        self._load_registered_faces()
        
        logger.info("会员验证器初始化成功")
    
    def _load_registered_faces(self):
        """从数据库加载已注册的人脸数据"""
        session = self.db_connector.get_session()
        try:
            # 查询所有有人脸数据的用户
            users = session.query(User).filter(
                User.face_encoding.isnot(None)
            ).all()
            
            # 加载人脸数据
            face_data = [(user.id, user.face_encoding) for user in users]
            self.face_recognizer.load_known_faces(face_data)
            
            logger.info(f"已加载 {len(face_data)} 个已注册人脸")
            
        except Exception as e:
            logger.error(f"加载人脸数据失败: {str(e)}")
        finally:
            session.close()
    
    def verify_by_face(self, image: np.ndarray) -> Optional[User]:
        """
        通过人脸验证会员身份
        
        Args:
            image: BGR格式的图像数组
            
        Returns:
            验证成功返回用户对象，失败返回None
        """
        try:
            # 识别人脸
            user_id = self.face_recognizer.recognize_from_image(image)
            
            if user_id is None:
                logger.info("未识别到注册用户")
                return None
            
            # 从数据库获取用户信息
            session = self.db_connector.get_session()
            try:
                user = session.query(User).filter(User.id == user_id).first()
                
                if user:
                    logger.info(f"验证成功: 用户={user.name}, 角色={user.role.value}")
                    return user
                else:
                    logger.warning(f"用户ID={user_id}不存在")
                    return None
                    
            finally:
                session.close()
                
        except Exception as e:
            logger.error(f"人脸验证失败: {str(e)}")
            return None
    
    def register_member_face(
        self, 
        user_id: int, 
        image: np.ndarray,
        save_image: bool = True
    ) -> Tuple[bool, str]:
        """
        为会员注册人脸数据
        
        Args:
            user_id: 用户ID
            image: BGR格式的图像数组
            save_image: 是否保存人脸图片
            
        Returns:
            (成功标志, 消息)
        """
        session = self.db_connector.get_session()
        try:
            # 检查用户是否存在
            user = session.query(User).filter(User.id == user_id).first()
            if not user:
                return False, f"用户ID={user_id}不存在"
            
            # 检测并编码人脸
            face_encoding = self.face_recognizer.encode_face(image)
            if face_encoding is None:
                return False, "未检测到人脸或人脸质量不佳"
            
            # 转换编码为字符串
            encoding_str = self.face_recognizer.encoding_to_string(face_encoding)
            
            # 保存到数据库
            user.face_encoding = encoding_str
            session.commit()
            
            # 注册到内存
            self.face_recognizer.register_face(user_id, face_encoding)
            
            # 保存人脸图片（可选）
            if save_image:
                self.face_recognizer.save_face_image(user_id, image)
            
            logger.info(f"人脸注册成功: 用户ID={user_id}, 姓名={user.name}")
            return True, "人脸注册成功"
            
        except Exception as e:
            session.rollback()
            error_msg = f"人脸注册失败: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
        finally:
            session.close()
    
    def verify_by_phone(self, phone: str) -> Optional[User]:
        """
        通过手机号验证会员身份
        
        Args:
            phone: 手机号
            
        Returns:
            验证成功返回用户对象，失败返回None
        """
        session = self.db_connector.get_session()
        try:
            user = session.query(User).filter(User.phone == phone).first()
            
            if user:
                logger.info(f"手机号验证成功: {phone}")
                return user
            else:
                logger.info(f"手机号未注册: {phone}")
                return None
                
        finally:
            session.close()
    
    def is_member(self, user_id: int) -> bool:
        """
        检查用户是否为会员
        
        Args:
            user_id: 用户ID
            
        Returns:
            是否为会员（VIP或MEMBER）
        """
        session = self.db_connector.get_session()
        try:
            user = session.query(User).filter(User.id == user_id).first()
            
            if user:
                return user.role in [UserRole.MEMBER, UserRole.VIP]
            
            return False
            
        finally:
            session.close()
    
    def get_user_info(self, user_id: int) -> Optional[dict]:
        """
        获取用户详细信息
        
        Args:
            user_id: 用户ID
            
        Returns:
            用户信息字典
        """
        session = self.db_connector.get_session()
        try:
            user = session.query(User).filter(User.id == user_id).first()
            
            if user:
                return {
                    'id': user.id,
                    'name': user.name,
                    'phone': user.phone,
                    'role': user.role.value,
                    'balance': float(user.balance),
                    'has_face': user.face_encoding is not None,
                    'created_at': user.created_at.isoformat() if user.created_at else None
                }
            
            return None
            
        finally:
            session.close()
    
    def update_face(self, user_id: int, image: np.ndarray) -> Tuple[bool, str]:
        """
        更新用户的人脸数据
        
        Args:
            user_id: 用户ID
            image: 新的人脸图像
            
        Returns:
            (成功标志, 消息)
        """
        # 先删除旧的人脸数据
        self._remove_face_from_memory(user_id)
        
        # 注册新的人脸
        return self.register_member_face(user_id, image)
    
    def _remove_face_from_memory(self, user_id: int):
        """从内存中移除用户的人脸数据"""
        try:
            if user_id in self.face_recognizer.known_user_ids:
                idx = self.face_recognizer.known_user_ids.index(user_id)
                del self.face_recognizer.known_user_ids[idx]
                del self.face_recognizer.known_face_encodings[idx]
                logger.info(f"已移除用户ID={user_id}的人脸数据")
        except Exception as e:
            logger.error(f"移除人脸数据失败: {str(e)}")
