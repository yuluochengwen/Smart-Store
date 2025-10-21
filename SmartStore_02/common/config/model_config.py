"""
模型配置文件
Model configuration for SmartStore AI models
"""
import os
from pathlib import Path


class ModelConfig:
    """AI模型配置类"""
    
    # 模型文件目录
    BASE_DIR = Path(__file__).resolve().parent.parent.parent
    MODELS_DIR = BASE_DIR / 'models'
    
    # YOLO配置 - 用于顾客和商品检测
    YOLO_CONFIG = {
        'customer_model': str(MODELS_DIR / 'yolo' / 'yolov8n.pt'),
        'commodity_model': str(MODELS_DIR / 'yolo' / 'commodity_yolov8.pt'),
        'confidence_threshold': 0.5,
        'iou_threshold': 0.45,
        'device': 'cuda' if os.getenv('USE_GPU', 'False').lower() == 'true' else 'cpu'
    }
    
    # 人脸识别配置
    FACE_RECOGNITION_CONFIG = {
        'tolerance': 0.6,  # 人脸识别容差
        'model': 'hog',  # 使用HOG模型，可选'cnn'（更准确但慢）
        'num_jitters': 1,  # 人脸编码时的采样次数
        'face_detection_model': 'hog'  # 人脸检测模型
    }
    
    # 语音识别配置 - Whisper
    SPEECH_RECOGNITION_CONFIG = {
        'model_name': 'base',  # tiny, base, small, medium, large
        'language': 'zh',  # 中文
        'device': 'cuda' if os.getenv('USE_GPU', 'False').lower() == 'true' else 'cpu',
        'sample_rate': 16000,
        'energy_threshold': 300,
        'pause_threshold': 0.8
    }
    
    # 文字转语音配置 - TTS
    TEXT_TO_SPEECH_CONFIG = {
        'engine': 'edge-tts',  # 可选 'gtts', 'edge-tts'
        'language': 'zh-CN',
        'voice': 'zh-CN-XiaoxiaoNeural',  # Edge TTS声音
        'rate': '+0%',
        'volume': '+0%'
    }
    
    # LLM配置
    LLM_CONFIG = {
        'model_name': os.getenv('LLM_MODEL', 'gpt-3.5-turbo'),
        'api_key': os.getenv('OPENAI_API_KEY', ''),
        'api_base': os.getenv('OPENAI_API_BASE', 'https://api.openai.com/v1'),
        'temperature': 0.7,
        'max_tokens': 500,
        'timeout': 30
    }
    
    # 文生图配置 - Stable Diffusion
    TEXT_TO_IMAGE_CONFIG = {
        'model_name': 'runwayml/stable-diffusion-v1-5',
        'device': 'cuda' if os.getenv('USE_GPU', 'False').lower() == 'true' else 'cpu',
        'num_inference_steps': 50,
        'guidance_scale': 7.5,
        'image_size': (512, 512),
        'num_images': 4
    }
    
    # 行为识别配置
    ACTION_RECOGNITION_CONFIG = {
        'model_path': str(MODELS_DIR / 'action' / 'action_recognition.pt'),
        'input_size': (224, 224),
        'num_frames': 16,
        'actions': ['拿取', '放回', '浏览', '其他']
    }
    
    # 商品识别配置
    COMMODITY_RECOGNITION_CONFIG = {
        'model_path': str(MODELS_DIR / 'commodity' / 'commodity_classifier.pt'),
        'input_size': (224, 224),
        'confidence_threshold': 0.7
    }
    
    @classmethod
    def init_directories(cls):
        """初始化模型目录"""
        directories = [
            cls.MODELS_DIR,
            cls.MODELS_DIR / 'yolo',
            cls.MODELS_DIR / 'action',
            cls.MODELS_DIR / 'commodity',
            cls.MODELS_DIR / 'face',
            cls.MODELS_DIR / 'whisper'
        ]
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)


# 初始化配置
ModelConfig.init_directories()
