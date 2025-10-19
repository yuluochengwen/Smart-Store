"""
问答模块
Question answering using LLM
"""
from typing import Optional, Dict
import openai
from data_layer.database.db_connector import db_connector
from data_layer.database.models import Commodity
from common.config.model_config import ModelConfig
from common.utils.text_utils import parse_commodity_query, format_response
from common.utils.logger import get_logger

logger = get_logger(__name__)


class QuestionAnswering:
    """问答系统"""
    
    def __init__(self):
        """初始化问答系统"""
        self.config = ModelConfig.LLM_CONFIG
        
        # 配置OpenAI
        if self.config['api_key']:
            openai.api_key = self.config['api_key']
            openai.api_base = self.config['api_base']
        
        logger.info("问答系统初始化成功")
    
    def answer(self, question: str, context: Dict = None) -> str:
        """
        回答用户问题
        
        Args:
            question: 用户问题
            context: 上下文信息
            
        Returns:
            回答文本
        """
        # 解析问题
        parsed = parse_commodity_query(question)
        action = parsed.get('action')
        
        logger.info(f"问题: {question}, 动作: {action}")
        
        # 根据动作类型回答
        if action == 'price':
            return self._answer_price_question(question, parsed)
        elif action == 'location':
            return self._answer_location_question(question, parsed)
        elif action == 'recommend':
            return self._answer_recommend_question(question, parsed)
        else:
            return self._answer_with_llm(question, context)
    
    def _answer_price_question(self, question: str, parsed: Dict) -> str:
        """回答价格相关问题"""
        keywords = parsed.get('keywords', [])
        
        if not keywords:
            return "请问您想了解哪个商品的价格？"
        
        try:
            with db_connector.session_scope() as session:
                # 查找商品
                commodity = None
                for keyword in keywords:
                    commodity = session.query(Commodity).filter(
                        Commodity.name.like(f'%{keyword}%')
                    ).first()
                    if commodity:
                        break
                
                if commodity:
                    return format_response('commodity_info', commodity.to_dict())
                else:
                    return f"抱歉，没有找到相关商品。"
        
        except Exception as e:
            logger.error(f"回答价格问题失败: {str(e)}")
            return "抱歉，查询商品信息时出错了。"
    
    def _answer_location_question(self, question: str, parsed: Dict) -> str:
        """回答位置相关问题"""
        keywords = parsed.get('keywords', [])
        
        if not keywords:
            return "请问您想了解哪个商品的位置？"
        
        try:
            with db_connector.session_scope() as session:
                commodity = None
                for keyword in keywords:
                    commodity = session.query(Commodity).filter(
                        Commodity.name.like(f'%{keyword}%')
                    ).first()
                    if commodity:
                        break
                
                if commodity:
                    return f"{commodity.name}位于{commodity.location}"
                else:
                    return f"抱歉，没有找到相关商品。"
        
        except Exception as e:
            logger.error(f"回答位置问题失败: {str(e)}")
            return "抱歉，查询商品信息时出错了。"
    
    def _answer_recommend_question(self, question: str, parsed: Dict) -> str:
        """回答推荐相关问题"""
        from .commodity_recommender import CommodityRecommender
        
        recommender = CommodityRecommender()
        recommendations = recommender.recommend_by_query(question)
        
        if recommendations:
            return format_response('recommend', {'items': recommendations})
        else:
            return "抱歉，暂时没有符合条件的商品推荐。"
    
    def _answer_with_llm(self, question: str, context: Dict = None) -> str:
        """使用LLM回答问题"""
        if not self.config['api_key']:
            logger.warning("未配置LLM API密钥，使用默认回答")
            return "抱歉，我暂时无法理解您的问题。请换个方式问我。"
        
        try:
            # 构建提示词
            system_prompt = """你是SmartStore无人商店的智能客服助手。
你的职责是回答顾客关于商品的问题，提供商品推荐，帮助顾客找到他们需要的商品。
请用简洁、友好的语气回答问题。"""
            
            # 调用LLM
            response = openai.ChatCompletion.create(
                model=self.config['model_name'],
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": question}
                ],
                temperature=self.config['temperature'],
                max_tokens=self.config['max_tokens'],
                timeout=self.config['timeout']
            )
            
            answer = response.choices[0].message.content
            logger.info(f"LLM回答: {answer}")
            return answer
            
        except Exception as e:
            logger.error(f"LLM回答失败: {str(e)}")
            return "抱歉，我暂时无法回答您的问题。"
