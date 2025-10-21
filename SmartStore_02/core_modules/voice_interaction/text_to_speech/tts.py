"""
文字转语音模块 (TTS - Text to Speech)
Using Edge TTS for text-to-speech synthesis
"""
import asyncio
from pathlib import Path
from typing import Optional
import edge_tts
from common.config.model_config import ModelConfig
from common.utils.logger import get_logger

logger = get_logger(__name__)


class TextToSpeech:
    """文字转语音类"""
    
    def __init__(self):
        """初始化TTS"""
        self.config = ModelConfig.TEXT_TO_SPEECH_CONFIG
        self.voice = self.config['voice']
        self.rate = self.config['rate']
        self.volume = self.config['volume']
        logger.info(f"TTS初始化成功: 声音={self.voice}")
    
    async def synthesize_async(self, text: str, output_file: str = None) -> Optional[str]:
        """
        异步合成语音
        
        Args:
            text: 要转换的文本
            output_file: 输出文件路径，如果为None则生成临时文件
            
        Returns:
            输出文件路径，失败返回None
        """
        try:
            if output_file is None:
                import tempfile
                output_file = tempfile.mktemp(suffix='.mp3')
            
            # 创建TTS通信对象
            communicate = edge_tts.Communicate(
                text,
                voice=self.voice,
                rate=self.rate,
                volume=self.volume
            )
            
            # 保存音频
            await communicate.save(output_file)
            logger.info(f"语音合成成功: {output_file}")
            return output_file
            
        except Exception as e:
            logger.error(f"语音合成失败: {str(e)}")
            return None
    
    def synthesize(self, text: str, output_file: str = None) -> Optional[str]:
        """
        同步合成语音（对外接口）
        
        Args:
            text: 要转换的文本
            output_file: 输出文件路径
            
        Returns:
            输出文件路径，失败返回None
        """
        try:
            # 运行异步函数
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(
                self.synthesize_async(text, output_file)
            )
            loop.close()
            return result
        except Exception as e:
            logger.error(f"语音合成失败: {str(e)}")
            return None
    
    def play_audio(self, audio_file: str):
        """
        播放音频文件
        
        Args:
            audio_file: 音频文件路径
        """
        try:
            import pygame
            pygame.mixer.init()
            pygame.mixer.music.load(audio_file)
            pygame.mixer.music.play()
            
            # 等待播放完成
            while pygame.mixer.music.get_busy():
                pygame.time.Clock().tick(10)
            
            logger.info(f"音频播放完成: {audio_file}")
        except Exception as e:
            logger.error(f"音频播放失败: {str(e)}")
    
    def speak(self, text: str):
        """
        直接朗读文本
        
        Args:
            text: 要朗读的文本
        """
        audio_file = self.synthesize(text)
        if audio_file:
            self.play_audio(audio_file)
