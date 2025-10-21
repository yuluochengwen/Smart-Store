"""
语音识别模块 (ASR - Automatic Speech Recognition)
Using Whisper model for speech recognition
"""
import speech_recognition as sr
import numpy as np
from typing import Optional
from common.config.model_config import ModelConfig
from common.utils.logger import get_logger

logger = get_logger(__name__)


class SpeechRecognizer:
    """语音识别器"""
    
    def __init__(self):
        """初始化语音识别器"""
        self.config = ModelConfig.SPEECH_RECOGNITION_CONFIG
        self.recognizer = sr.Recognizer()
        self.recognizer.energy_threshold = self.config['energy_threshold']
        self.recognizer.pause_threshold = self.config['pause_threshold']
        logger.info("语音识别器初始化成功")
    
    def recognize_from_microphone(self, timeout: int = 5) -> Optional[str]:
        """
        从麦克风识别语音
        
        Args:
            timeout: 超时时间（秒）
            
        Returns:
            识别的文本，失败返回None
        """
        try:
            with sr.Microphone() as source:
                logger.info("请说话...")
                # 调整环境噪音
                self.recognizer.adjust_for_ambient_noise(source, duration=1)
                # 录音
                audio = self.recognizer.listen(source, timeout=timeout)
                
                # 识别
                text = self.recognizer.recognize_google(
                    audio,
                    language='zh-CN'
                )
                logger.info(f"识别结果: {text}")
                return text
                
        except sr.WaitTimeoutError:
            logger.warning("录音超时")
            return None
        except sr.UnknownValueError:
            logger.warning("无法识别语音")
            return None
        except Exception as e:
            logger.error(f"语音识别失败: {str(e)}")
            return None
    
    def recognize_from_file(self, audio_file: str) -> Optional[str]:
        """
        从音频文件识别语音
        
        Args:
            audio_file: 音频文件路径
            
        Returns:
            识别的文本，失败返回None
        """
        try:
            with sr.AudioFile(audio_file) as source:
                audio = self.recognizer.record(source)
                
                # 识别
                text = self.recognizer.recognize_google(
                    audio,
                    language='zh-CN'
                )
                logger.info(f"识别结果: {text}")
                return text
                
        except Exception as e:
            logger.error(f"音频文件识别失败: {str(e)}")
            return None
