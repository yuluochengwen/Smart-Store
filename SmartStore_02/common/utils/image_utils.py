"""
图像处理工具
Image processing utilities for SmartStore
"""
import cv2
import numpy as np
from PIL import Image
from typing import Tuple, Optional
from pathlib import Path


def load_image(image_path: str) -> np.ndarray:
    """
    加载图像文件
    
    Args:
        image_path: 图像文件路径
        
    Returns:
        图像数组 (BGR格式)
    """
    image = cv2.imread(str(image_path))
    if image is None:
        raise ValueError(f"无法加载图像: {image_path}")
    return image


def save_image(image: np.ndarray, save_path: str) -> bool:
    """
    保存图像文件
    
    Args:
        image: 图像数组
        save_path: 保存路径
        
    Returns:
        是否保存成功
    """
    try:
        Path(save_path).parent.mkdir(parents=True, exist_ok=True)
        return cv2.imwrite(str(save_path), image)
    except Exception as e:
        print(f"保存图像失败: {str(e)}")
        return False


def resize_image(image: np.ndarray, size: Tuple[int, int], keep_ratio: bool = True) -> np.ndarray:
    """
    调整图像大小
    
    Args:
        image: 原始图像
        size: 目标大小 (width, height)
        keep_ratio: 是否保持宽高比
        
    Returns:
        调整后的图像
    """
    if keep_ratio:
        h, w = image.shape[:2]
        target_w, target_h = size
        
        # 计算缩放比例
        ratio = min(target_w / w, target_h / h)
        new_w, new_h = int(w * ratio), int(h * ratio)
        
        # 调整大小
        resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
        
        # 创建黑色背景
        result = np.zeros((target_h, target_w, 3), dtype=np.uint8)
        
        # 计算居中位置
        y_offset = (target_h - new_h) // 2
        x_offset = (target_w - new_w) // 2
        
        # 粘贴图像
        result[y_offset:y_offset+new_h, x_offset:x_offset+new_w] = resized
        
        return result
    else:
        return cv2.resize(image, size, interpolation=cv2.INTER_AREA)


def crop_image(image: np.ndarray, bbox: Tuple[int, int, int, int]) -> np.ndarray:
    """
    裁剪图像
    
    Args:
        image: 原始图像
        bbox: 边界框 (x1, y1, x2, y2)
        
    Returns:
        裁剪后的图像
    """
    x1, y1, x2, y2 = bbox
    return image[y1:y2, x1:x2]


def bgr_to_rgb(image: np.ndarray) -> np.ndarray:
    """BGR转RGB"""
    return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)


def rgb_to_bgr(image: np.ndarray) -> np.ndarray:
    """RGB转BGR"""
    return cv2.cvtColor(image, cv2.COLOR_RGB2BGR)


def numpy_to_pil(image: np.ndarray) -> Image.Image:
    """
    NumPy数组转PIL图像
    
    Args:
        image: NumPy图像数组 (BGR)
        
    Returns:
        PIL图像对象
    """
    return Image.fromarray(bgr_to_rgb(image))


def pil_to_numpy(image: Image.Image) -> np.ndarray:
    """
    PIL图像转NumPy数组
    
    Args:
        image: PIL图像对象
        
    Returns:
        NumPy图像数组 (BGR)
    """
    return rgb_to_bgr(np.array(image))


def draw_bbox(image: np.ndarray, bbox: Tuple[int, int, int, int], 
              label: str = '', color: Tuple[int, int, int] = (0, 255, 0), 
              thickness: int = 2) -> np.ndarray:
    """
    在图像上绘制边界框
    
    Args:
        image: 原始图像
        bbox: 边界框 (x1, y1, x2, y2)
        label: 标签文本
        color: 框的颜色 (B, G, R)
        thickness: 线条粗细
        
    Returns:
        绘制后的图像
    """
    img = image.copy()
    x1, y1, x2, y2 = bbox
    
    # 绘制矩形框
    cv2.rectangle(img, (x1, y1), (x2, y2), color, thickness)
    
    # 绘制标签
    if label:
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.6
        font_thickness = 2
        
        # 获取文本大小
        (text_width, text_height), baseline = cv2.getTextSize(
            label, font, font_scale, font_thickness
        )
        
        # 绘制文本背景
        cv2.rectangle(img, (x1, y1 - text_height - 10), 
                     (x1 + text_width, y1), color, -1)
        
        # 绘制文本
        cv2.putText(img, label, (x1, y1 - 5), font, 
                   font_scale, (255, 255, 255), font_thickness)
    
    return img


def enhance_image(image: np.ndarray, brightness: float = 1.0, 
                  contrast: float = 1.0) -> np.ndarray:
    """
    增强图像亮度和对比度
    
    Args:
        image: 原始图像
        brightness: 亮度因子 (1.0为原始)
        contrast: 对比度因子 (1.0为原始)
        
    Returns:
        增强后的图像
    """
    # 转换为浮点数
    img = image.astype(np.float32)
    
    # 调整亮度和对比度
    img = img * contrast + brightness
    
    # 裁剪到有效范围
    img = np.clip(img, 0, 255)
    
    return img.astype(np.uint8)
