"""
人脸识别模块 - 使用 DeepFace + TensorFlow GPU
Face recognition for customer identification using DeepFace with GPU acceleration
"""
import cv2
import numpy as np
from typing import List, Optional, Tuple, Dict
from pathlib import Path
from deepface import DeepFace
from common.config.model_config import ModelConfig
from common.utils.logger import get_logger
from common.exceptions.custom_exceptions import RecognitionException

logger = get_logger(__name__)


class FaceRecognizer:
    """人脸识别器 - 使用DeepFace"""
    
    def __init__(self, model_name: str = 'Facenet'):
        """
        初始化人脸识别器
        
        Args:
            model_name: 模型名称，可选: 'VGG-Face', 'Facenet', 'Facenet512', 
                       'OpenFace', 'DeepFace', 'DeepID', 'ArcFace', 'Dlib', 'SFace'
        """
        self.model_name = model_name
        self.detector_backend = 'opencv'  # 可选: 'opencv', 'ssd', 'mtcnn', 'retinaface'
        
        # 人脸数据库路径
        self.db_path = Path(ModelConfig.BASE_DIR) / 'data_layer' / 'storage' / 'face_database'
        self.db_path.mkdir(parents=True, exist_ok=True)
        
        # 存储已知人脸编码和对应的用户ID
        self.known_face_encodings = []
        self.known_user_ids = []
        
        logger.info(f"人脸识别器初始化成功 (模型: {self.model_name})")
    
    def detect_faces(self, image: np.ndarray) -> List[Dict]:
        """
        检测图像中的所有人脸位置
        
        Args:
            image: BGR格式的图像数组
            
        Returns:
            人脸信息列表
        """
        try:
            # 转换为RGB
            if len(image.shape) == 3 and image.shape[2] == 3:
                rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            else:
                rgb_image = image
            
            # 使用DeepFace检测人脸
            faces = DeepFace.extract_faces(
                img_path=rgb_image,
                detector_backend=self.detector_backend,
                enforce_detection=False
            )
            
            face_list = []
            for face in faces:
                if face['confidence'] > 0.9:  # 置信度阈值
                    facial_area = face['facial_area']
                    face_list.append({
                        'bbox': (
                            facial_area['x'],
                            facial_area['y'],
                            facial_area['x'] + facial_area['w'],
                            facial_area['y'] + facial_area['h']
                        ),
                        'confidence': face['confidence']
                    })
            
            return face_list
            
        except Exception as e:
            logger.error(f"人脸检测失败: {str(e)}")
            return []
    
    def encode_face(self, image: np.ndarray) -> Optional[np.ndarray]:
        """
        对人脸进行编码
        
        Args:
            image: RGB格式的图像数组
            
        Returns:
            人脸编码数组，失败返回None
        """
        try:
            # 转换为RGB
            if len(image.shape) == 3 and image.shape[2] == 3:
                rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            else:
                rgb_image = image
            
            # 使用DeepFace生成人脸嵌入向量
            embedding_objs = DeepFace.represent(
                img_path=rgb_image,
                model_name=self.model_name,
                detector_backend=self.detector_backend,
                enforce_detection=False
            )
            
            if embedding_objs:
                embedding = np.array(embedding_objs[0]['embedding'])
                return embedding
            else:
                logger.warning("未检测到人脸")
                return None
                
        except Exception as e:
            logger.error(f"人脸编码失败: {str(e)}")
            return None
    
    def register_face(self, user_id: int, face_encoding: np.ndarray):
        """
        注册新的人脸编码
        
        Args:
            user_id: 用户ID
            face_encoding: 人脸编码
        """
        self.known_face_encodings.append(face_encoding)
        self.known_user_ids.append(user_id)
        logger.info(f"注册人脸: 用户ID={user_id}")
    
    def recognize_face(self, face_encoding: np.ndarray, threshold: float = 0.6) -> Optional[int]:
        """
        识别人脸，返回匹配的用户ID
        
        Args:
            face_encoding: 待识别的人脸编码
            threshold: 相似度阈值（越小越严格）
            
        Returns:
            匹配的用户ID，未匹配返回None
        """
        if not self.known_face_encodings:
            logger.warning("没有已注册的人脸数据")
            return None
        
        try:
            # 计算余弦相似度
            min_distance = float('inf')
            best_match_idx = -1
            
            for idx, known_encoding in enumerate(self.known_face_encodings):
                # 计算欧氏距离
                distance = np.linalg.norm(face_encoding - known_encoding)
                
                if distance < min_distance:
                    min_distance = distance
                    best_match_idx = idx
            
            # 检查是否在阈值内
            if min_distance < threshold:
                user_id = self.known_user_ids[best_match_idx]
                logger.info(f"识别成功: 用户ID={user_id}, 距离={min_distance:.4f}")
                return user_id
            
            logger.info("未找到匹配的人脸")
            return None
            
        except Exception as e:
            logger.error(f"人脸识别失败: {str(e)}")
            return None
    
    def recognize_from_image(self, image: np.ndarray) -> Optional[int]:
        """
        从图像中识别人脸
        
        Args:
            image: BGR格式的图像数组
            
        Returns:
            匹配的用户ID，未匹配返回None
        """
        # 检测并编码人脸
        face_encoding = self.encode_face(image)
        if face_encoding is None:
            return None
        
        # 识别人脸
        return self.recognize_face(face_encoding)
    
    def verify_faces(self, img1: np.ndarray, img2: np.ndarray) -> bool:
        """
        验证两张图片是否为同一人
        
        Args:
            img1: 第一张图片
            img2: 第二张图片
            
        Returns:
            是否为同一人
        """
        try:
            result = DeepFace.verify(
                img1_path=img1,
                img2_path=img2,
                model_name=self.model_name,
                detector_backend=self.detector_backend,
                enforce_detection=False
            )
            return result['verified']
        except Exception as e:
            logger.error(f"人脸验证失败: {str(e)}")
            return False
    
    def load_known_faces(self, user_face_data: List[Tuple[int, str]]):
        """
        批量加载已知人脸数据
        
        Args:
            user_face_data: [(user_id, face_encoding_str), ...]
        """
        self.known_face_encodings = []
        self.known_user_ids = []
        
        for user_id, encoding_str in user_face_data:
            try:
                # 将字符串转换回numpy数组
                encoding = np.fromstring(encoding_str, sep=',')
                self.register_face(user_id, encoding)
            except Exception as e:
                logger.error(f"加载人脸数据失败: 用户ID={user_id}, 错误={str(e)}")
        
        logger.info(f"已加载 {len(self.known_user_ids)} 个已知人脸")
    
    @staticmethod
    def encoding_to_string(encoding: np.ndarray) -> str:
        """
        将人脸编码转换为字符串（用于存储）
        
        Args:
            encoding: 人脸编码数组
            
        Returns:
            编码字符串
        """
        return ','.join(map(str, encoding))
    
    @staticmethod
    def string_to_encoding(encoding_str: str) -> np.ndarray:
        """
        将字符串转换为人脸编码
        
        Args:
            encoding_str: 编码字符串
            
        Returns:
            人脸编码数组
        """
        return np.fromstring(encoding_str, sep=',')
    
    def save_face_image(self, user_id: int, image: np.ndarray):
        """
        保存用户人脸图片到数据库
        
        Args:
            user_id: 用户ID
            image: 人脸图像
        """
        try:
            face_path = self.db_path / f"user_{user_id}.jpg"
            cv2.imwrite(str(face_path), image)
            logger.info(f"保存人脸图片: {face_path}")
        except Exception as e:
            logger.error(f"保存人脸图片失败: {str(e)}")
