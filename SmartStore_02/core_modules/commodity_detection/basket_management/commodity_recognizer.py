"""
商品识别器
Commodity recognizer using YOLO and classification models
"""
import cv2
import numpy as np
from typing import List, Dict, Optional
from ultralytics import YOLO
from common.config.model_config import ModelConfig
from common.utils.logger import get_logger
from common.exceptions.custom_exceptions import RecognitionException

logger = get_logger(__name__)


class CommodityRecognizer:
    """商品识别类"""
    
    def __init__(self, model_path: str = None):
        """
        初始化商品识别器
        
        Args:
            model_path: 模型路径
        """
        self.config = ModelConfig.YOLO_CONFIG
        self.model_path = model_path or self.config['commodity_model']
        self.confidence_threshold = self.config['confidence_threshold']
        
        # 加载YOLO模型
        try:
            self.model = YOLO(self.model_path)
            logger.info(f"商品识别模型加载成功: {self.model_path}")
        except Exception as e:
            logger.error(f"商品识别模型加载失败: {str(e)}")
            raise RecognitionException(f"模型加载失败: {str(e)}")
    
    def recognize(self, image: np.ndarray) -> List[Dict]:
        """
        识别图像中的商品
        
        Args:
            image: 输入图像
            
        Returns:
            识别结果列表
        """
        try:
            results = self.model(
                image,
                conf=self.confidence_threshold,
                device=self.config['device']
            )
            
            detections = []
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = float(box.conf[0])
                    class_id = int(box.cls[0])
                    class_name = result.names[class_id]
                    
                    detections.append({
                        'bbox': (int(x1), int(y1), int(x2), int(y2)),
                        'confidence': confidence,
                        'class_id': class_id,
                        'class_name': class_name
                    })
            
            return detections
            
        except Exception as e:
            logger.error(f"商品识别失败: {str(e)}")
            raise RecognitionException(f"识别失败: {str(e)}")
    
    def recognize_by_name(self, image: np.ndarray, commodity_name: str) -> Optional[Dict]:
        """
        识别特定名称的商品
        
        Args:
            image: 输入图像
            commodity_name: 商品名称
            
        Returns:
            识别结果，未找到返回None
        """
        detections = self.recognize(image)
        
        for detection in detections:
            if detection['class_name'] == commodity_name:
                return detection
        
        return None
