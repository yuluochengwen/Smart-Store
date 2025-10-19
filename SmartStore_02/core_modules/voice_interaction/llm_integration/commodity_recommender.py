"""
商品推荐模块
Commodity recommender using LLM
"""
from typing import List, Dict, Optional
from data_layer.database.db_connector import db_connector
from data_layer.database.models import Commodity
from common.utils.text_utils import parse_commodity_query
from common.utils.logger import get_logger

logger = get_logger(__name__)


class CommodityRecommender:
    """商品推荐器"""
    
    def __init__(self):
        """初始化商品推荐器"""
        logger.info("商品推荐器初始化成功")
    
    def recommend_by_query(self, query: str, top_k: int = 3) -> List[Dict]:
        """
        根据查询推荐商品
        
        Args:
            query: 用户查询文本
            top_k: 返回前k个推荐
            
        Returns:
            推荐商品列表
        """
        # 解析查询
        parsed = parse_commodity_query(query)
        category = parsed.get('category')
        keywords = parsed.get('keywords', [])
        
        logger.info(f"查询解析: 类别={category}, 关键词={keywords}")
        
        try:
            with db_connector.session_scope() as session:
                # 构建查询
                query_obj = session.query(Commodity).filter(Commodity.stock > 0)
                
                # 按类别筛选
                if category:
                    query_obj = query_obj.filter(Commodity.category == category)
                
                # 按关键词筛选
                if keywords:
                    for keyword in keywords:
                        query_obj = query_obj.filter(
                            Commodity.name.like(f'%{keyword}%') |
                            Commodity.description.like(f'%{keyword}%')
                        )
                
                # 获取结果
                commodities = query_obj.limit(top_k).all()
                
                results = [commodity.to_dict() for commodity in commodities]
                logger.info(f"推荐 {len(results)} 个商品")
                return results
                
        except Exception as e:
            logger.error(f"商品推荐失败: {str(e)}")
            return []
    
    def recommend_by_category(self, category: str, top_k: int = 3) -> List[Dict]:
        """
        按类别推荐商品
        
        Args:
            category: 商品类别
            top_k: 返回前k个推荐
            
        Returns:
            推荐商品列表
        """
        try:
            with db_connector.session_scope() as session:
                commodities = session.query(Commodity).filter(
                    Commodity.category == category,
                    Commodity.stock > 0
                ).limit(top_k).all()
                
                return [commodity.to_dict() for commodity in commodities]
                
        except Exception as e:
            logger.error(f"按类别推荐失败: {str(e)}")
            return []
    
    def recommend_popular(self, top_k: int = 5) -> List[Dict]:
        """
        推荐热门商品
        
        Args:
            top_k: 返回前k个推荐
            
        Returns:
            推荐商品列表
        """
        try:
            with db_connector.session_scope() as session:
                # 这里可以根据销量、浏览量等排序
                # 暂时按价格降序
                commodities = session.query(Commodity).filter(
                    Commodity.stock > 0
                ).order_by(Commodity.price.desc()).limit(top_k).all()
                
                return [commodity.to_dict() for commodity in commodities]
                
        except Exception as e:
            logger.error(f"推荐热门商品失败: {str(e)}")
            return []
