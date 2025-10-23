"""
摄像头处理工具
提供摄像头控制、图像处理、商品识别等功能
"""

import cv2
import numpy as np
import threading
import time
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from pathlib import Path

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CameraManager:
    """摄像头管理器"""
    
    def __init__(self, camera_id: int = 0, width: int = 1280, height: int = 720):
        """初始化摄像头管理器"""
        self.camera_id = camera_id
        self.width = width
        self.height = height
        self.camera = None
        self.is_running = False
        self.thread = None
        self.frame_lock = threading.Lock()
        self.current_frame = None
        self.detection_callback = None
        self.detection_interval = 3.0  # 检测间隔（秒）
        self.last_detection_time = 0
        
    def start_camera(self) -> bool:
        """启动摄像头"""
        try:
            self.camera = cv2.VideoCapture(self.camera_id)
            
            if not self.camera.isOpened():
                logger.error("无法打开摄像头")
                return False
            
            # 设置摄像头参数
            self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
            self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
            self.camera.set(cv2.CAP_PROP_FPS, 30)
            
            self.is_running = True
            self.thread = threading.Thread(target=self._capture_loop)
            self.thread.daemon = True
            self.thread.start()
            
            logger.info(f"摄像头已启动: {self.width}x{self.height}")
            return True
            
        except Exception as e:
            logger.error(f"启动摄像头失败: {e}")
            return False
    
    def stop_camera(self):
        """停止摄像头"""
        self.is_running = False
        
        if self.thread:
            self.thread.join(timeout=2)
        
        if self.camera:
            self.camera.release()
            self.camera = None
        
        logger.info("摄像头已停止")
    
    def _capture_loop(self):
        """摄像头捕获循环"""
        while self.is_running:
            try:
                ret, frame = self.camera.read()
                
                if ret:
                    with self.frame_lock:
                        self.current_frame = frame.copy()
                    
                    # 检查是否需要进行商品检测
                    current_time = time.time()
                    if (current_time - self.last_detection_time) >= self.detection_interval:
                        if self.detection_callback:
                            self.detection_callback(frame)
                        self.last_detection_time = current_time
                
                time.sleep(0.033)  # 约30fps
                
            except Exception as e:
                logger.error(f"摄像头捕获错误: {e}")
                time.sleep(1)
    
    def get_frame(self) -> Optional[np.ndarray]:
        """获取当前帧"""
        with self.frame_lock:
            return self.current_frame.copy() if self.current_frame is not None else None
    
    def set_detection_callback(self, callback):
        """设置检测回调函数"""
        self.detection_callback = callback
    
    def save_frame(self, filename: str = None) -> str:
        """保存当前帧"""
        frame = self.get_frame()
        if frame is None:
            raise ValueError("无法获取摄像头帧")
        
        if filename is None:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"capture_{timestamp}.jpg"
        
        filepath = Path("uploads/captures") / filename
        filepath.parent.mkdir(parents=True, exist_ok=True)
        
        cv2.imwrite(str(filepath), frame)
        return str(filepath)

class ObjectDetector:
    """物体检测器"""
    
    def __init__(self):
        """初始化检测器"""
        self.confidence_threshold = 0.7
        self.detection_history = []
        self.max_history = 10
        
    def detect_objects(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """检测图像中的物体"""
        try:
            # 这里应该集成真实的AI模型
            # 现在使用模拟检测
            detections = self._simulate_detection(frame)
            
            # 过滤检测结果
            filtered_detections = []
            for detection in detections:
                if detection['confidence'] >= self.confidence_threshold:
                    filtered_detections.append(detection)
            
            # 更新检测历史
            self._update_detection_history(filtered_detections)
            
            return filtered_detections
            
        except Exception as e:
            logger.error(f"物体检测失败: {e}")
            return []
    
    def _simulate_detection(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """模拟检测（实际项目中应替换为真实AI模型）"""
        # 模拟商品检测
        products = [
            {'id': 1, 'name': '苹果', 'price': 5.99, 'icon': '🍎'},
            {'id': 2, 'name': '香蕉', 'price': 3.99, 'icon': '🍌'},
            {'id': 3, 'name': '牛奶', 'price': 12.99, 'icon': '🥛'},
            {'id': 4, 'name': '面包', 'price': 8.99, 'icon': '🍞'},
            {'id': 5, 'name': '鸡蛋', 'price': 15.99, 'icon': '🥚'}
        ]
        
        detections = []
        
        # 随机检测1-3个商品
        num_detections = np.random.randint(1, 4)
        
        for i in range(num_detections):
            product = np.random.choice(products)
            
            # 随机生成检测框坐标
            x = np.random.randint(100, frame.shape[1] - 200)
            y = np.random.randint(100, frame.shape[0] - 200)
            w = np.random.randint(100, 300)
            h = np.random.randint(100, 300)
            
            detection = {
                'id': product['id'],
                'name': product['name'],
                'price': product['price'],
                'icon': product['icon'],
                'confidence': np.random.uniform(0.8, 0.99),
                'bbox': {
                    'x': x,
                    'y': y,
                    'width': w,
                    'height': h
                }
            }
            
            detections.append(detection)
        
        return detections
    
    def _update_detection_history(self, detections: List[Dict[str, Any]]):
        """更新检测历史"""
        self.detection_history.append({
            'timestamp': time.time(),
            'detections': detections
        })
        
        # 保持历史记录数量
        if len(self.detection_history) > self.max_history:
            self.detection_history.pop(0)
    
    def get_stable_detections(self) -> List[Dict[str, Any]]:
        """获取稳定的检测结果"""
        if len(self.detection_history) < 3:
            return []
        
        # 分析最近3次检测结果
        recent_detections = self.detection_history[-3:]
        
        # 统计出现频率
        detection_count = {}
        for detection_data in recent_detections:
            for detection in detection_data['detections']:
                product_id = detection['id']
                if product_id not in detection_count:
                    detection_count[product_id] = {
                        'detection': detection,
                        'count': 0
                    }
                detection_count[product_id]['count'] += 1
        
        # 返回出现次数大于等于2的商品
        stable_detections = []
        for product_id, data in detection_count.items():
            if data['count'] >= 2:
                stable_detections.append(data['detection'])
        
        return stable_detections

class TrafficCounter:
    """人流量计数器"""
    
    def __init__(self):
        """初始化人流量计数器"""
        self.entered_count = 0
        self.left_count = 0
        self.current_count = 0
        self.daily_stats = {
            'today_entered': 0,
            'today_left': 0,
            'today_total': 0
        }
        self.detection_zone = None
        self.tracking_objects = {}
        self.next_object_id = 0
        
    def set_detection_zone(self, zone: Dict[str, int]):
        """设置检测区域"""
        self.detection_zone = zone
    
    def process_frame(self, frame: np.ndarray) -> Dict[str, Any]:
        """处理帧进行人流量统计"""
        try:
            # 这里应该集成真实的人流量统计算法
            # 现在使用模拟统计
            stats = self._simulate_traffic_counting()
            
            return {
                'entered': stats['entered'],
                'left': stats['left'],
                'current': stats['current'],
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"人流量统计失败: {e}")
            return {}
    
    def _simulate_traffic_counting(self) -> Dict[str, int]:
        """模拟人流量统计"""
        import random
        
        # 随机生成人流量变化
        if random.random() > 0.7:  # 30%概率有人进入
            self.entered_count += 1
            self.current_count += 1
            self.daily_stats['today_entered'] += 1
        
        if random.random() > 0.8:  # 20%概率有人离开
            self.left_count += 1
            self.current_count = max(0, self.current_count - 1)
            self.daily_stats['today_left'] += 1
        
        self.daily_stats['today_total'] = self.daily_stats['today_entered'] + self.daily_stats['today_left']
        
        return {
            'entered': self.entered_count,
            'left': self.left_count,
            'current': self.current_count
        }
    
    def get_daily_stats(self) -> Dict[str, int]:
        """获取今日统计"""
        return self.daily_stats.copy()
    
    def reset_daily_stats(self):
        """重置今日统计"""
        self.daily_stats = {
            'today_entered': 0,
            'today_left': 0,
            'today_total': 0
        }

class ImageProcessor:
    """图像处理器"""
    
    @staticmethod
    def draw_detections(frame: np.ndarray, detections: List[Dict[str, Any]]) -> np.ndarray:
        """在图像上绘制检测结果"""
        result_frame = frame.copy()
        
        for detection in detections:
            bbox = detection.get('bbox', {})
            
            if bbox:
                # 绘制检测框
                x, y, w, h = bbox['x'], bbox['y'], bbox['width'], bbox['height']
                cv2.rectangle(result_frame, (x, y), (x + w, y + h), (0, 255, 136), 2)
                
                # 绘制标签
                label = f"{detection['name']} ¥{detection['price']}"
                confidence = f"{detection['confidence']:.1%}"
                
                # 标签背景
                label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
                conf_size = cv2.getTextSize(confidence, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)[0]
                
                cv2.rectangle(result_frame, (x, y - 35), (x + max(label_size[0], conf_size[0]) + 10, y - 5), (0, 255, 136), -1)
                
                # 标签文字
                cv2.putText(result_frame, label, (x + 5, y - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                cv2.putText(result_frame, confidence, (x + 5, y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        return result_frame
    
    @staticmethod
    def draw_traffic_stats(frame: np.ndarray, stats: Dict[str, int]) -> np.ndarray:
        """在图像上绘制人流量统计"""
        result_frame = frame.copy()
        
        # 统计信息背景
        cv2.rectangle(result_frame, (10, 10), (300, 120), (0, 0, 0), -1)
        cv2.rectangle(result_frame, (10, 10), (300, 120), (255, 255, 255), 2)
        
        # 统计信息文字
        y_offset = 35
        cv2.putText(result_frame, f"进入: {stats.get('entered', 0)}", (20, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        y_offset += 25
        cv2.putText(result_frame, f"离开: {stats.get('left', 0)}", (20, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        
        y_offset += 25
        cv2.putText(result_frame, f"在场: {stats.get('current', 0)}", (20, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
        
        y_offset += 25
        timestamp = datetime.now().strftime('%H:%M:%S')
        cv2.putText(result_frame, f"时间: {timestamp}", (20, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        return result_frame

# 全局实例
camera_manager = CameraManager()
object_detector = ObjectDetector()
traffic_counter = TrafficCounter()

def init_camera_system():
    """初始化摄像头系统"""
    try:
        # 启动摄像头
        if camera_manager.start_camera():
            logger.info("摄像头系统初始化成功")
            return True
        else:
            logger.error("摄像头系统初始化失败")
            return False
    except Exception as e:
        logger.error(f"摄像头系统初始化异常: {e}")
        return False

def cleanup_camera_system():
    """清理摄像头系统"""
    try:
        camera_manager.stop_camera()
        logger.info("摄像头系统清理完成")
    except Exception as e:
        logger.error(f"摄像头系统清理异常: {e}")

# 导出函数和类
__all__ = [
    'CameraManager',
    'ObjectDetector',
    'TrafficCounter',
    'ImageProcessor',
    'camera_manager',
    'object_detector',
    'traffic_counter',
    'init_camera_system',
    'cleanup_camera_system'
]