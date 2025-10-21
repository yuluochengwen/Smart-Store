"""
顾客检测器
Customer detector using YOLO
"""
import cv2
import numpy as np
from typing import List, Tuple, Dict
from ultralytics import YOLO
from common.config.model_config import ModelConfig
from common.utils.logger import get_logger
from common.exceptions.custom_exceptions import DetectionException

logger = get_logger(__name__)


class CustomerDetector:
    """顾客检测类"""
    
    def __init__(self, model_path: str = None, config: dict = None):
        """
        初始化顾客检测器
        
        Args:
            model_path: 模型路径
            config: 配置字典
        """
        self.config = config or ModelConfig.YOLO_CONFIG
        self.model_path = model_path or self.config['customer_model']
        self.confidence_threshold = self.config['confidence_threshold']
        self.iou_threshold = self.config['iou_threshold']
        self.device = self.config['device']
        
        # 加载YOLO模型
        try:
            self.model = YOLO(self.model_path)
            logger.info(f"顾客检测模型加载成功: {self.model_path}")
        except Exception as e:
            logger.error(f"顾客检测模型加载失败: {str(e)}")
            raise DetectionException(f"模型加载失败: {str(e)}")
    
    def detect(self, frame: np.ndarray) -> List[Dict]:
        """
        检测图像中的顾客
        
        Args:
            frame: 输入图像帧
            
        Returns:
            检测结果列表，每个元素包含 bbox, confidence, class_id
        """
        try:
            # 运行检测
            results = self.model(
                frame,
                conf=self.confidence_threshold,
                iou=self.iou_threshold,
                device=self.device,
                classes=[0]  # 只检测人（person类别）
            )
            
            detections = []
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    # 获取边界框坐标
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = float(box.conf[0])
                    class_id = int(box.cls[0])
                    
                    detections.append({
                        'bbox': (int(x1), int(y1), int(x2), int(y2)),
                        'confidence': confidence,
                        'class_id': class_id,
                        'class_name': 'person'
                    })
            
            return detections
            
        except Exception as e:
            logger.error(f"顾客检测失败: {str(e)}")
            raise DetectionException(f"检测失败: {str(e)}")
    
    def track(self, frame: np.ndarray) -> List[Dict]:
        """
        跟踪图像中的顾客
        
        Args:
            frame: 输入图像帧
            
        Returns:
            跟踪结果列表，每个元素包含 bbox, track_id, confidence
        """
        try:
            # 使用YOLO的内置跟踪功能
            results = self.model.track(
                frame,
                conf=self.confidence_threshold,
                iou=self.iou_threshold,
                device=self.device,
                classes=[0],
                persist=True  # 持续跟踪
            )
            
            tracks = []
            for result in results:
                boxes = result.boxes
                if boxes.id is None:
                    continue
                    
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = float(box.conf[0])
                    track_id = int(box.id[0]) if box.id is not None else -1
                    
                    tracks.append({
                        'bbox': (int(x1), int(y1), int(x2), int(y2)),
                        'track_id': track_id,
                        'confidence': confidence
                    })
            
            return tracks
            
        except Exception as e:
            logger.error(f"顾客跟踪失败: {str(e)}")
            return []
    
    def count_customers(self, frame: np.ndarray) -> int:
        """
        统计画面中的顾客数量
        
        Args:
            frame: 输入图像帧
            
        Returns:
            顾客数量
        """
        detections = self.detect(frame)
        return len(detections)
    
    def get_customer_roi(self, frame: np.ndarray, bbox: Tuple[int, int, int, int]) -> np.ndarray:
        """
        提取顾客的感兴趣区域（ROI）
        
        Args:
            frame: 输入图像帧
            bbox: 边界框 (x1, y1, x2, y2)
            
        Returns:
            ROI图像
        """
        x1, y1, x2, y2 = bbox
        return frame[y1:y2, x1:x2]
