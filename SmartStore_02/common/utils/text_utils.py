"""
文本处理工具
Text processing utilities for SmartStore
"""
import re
import jieba
from typing import List, Dict


def clean_text(text: str) -> str:
    """
    清理文本，去除特殊字符
    
    Args:
        text: 原始文本
        
    Returns:
        清理后的文本
    """
    # 去除多余空白
    text = re.sub(r'\s+', ' ', text)
    # 去除特殊字符，保留中文、英文、数字和基本标点
    text = re.sub(r'[^\w\s\u4e00-\u9fff,.!?;:，。！?；：]', '', text)
    return text.strip()


def extract_keywords(text: str, top_k: int = 5) -> List[str]:
    """
    提取文本关键词
    
    Args:
        text: 输入文本
        top_k: 返回前k个关键词
        
    Returns:
        关键词列表
    """
    import jieba.analyse
    keywords = jieba.analyse.extract_tags(text, topK=top_k, withWeight=False)
    return keywords


def segment_text(text: str) -> List[str]:
    """
    中文分词
    
    Args:
        text: 输入文本
        
    Returns:
        分词结果列表
    """
    return list(jieba.cut(text))


def calculate_similarity(text1: str, text2: str) -> float:
    """
    计算两个文本的相似度（基于词袋模型）
    
    Args:
        text1: 文本1
        text2: 文本2
        
    Returns:
        相似度分数 (0-1)
    """
    words1 = set(segment_text(text1))
    words2 = set(segment_text(text2))
    
    if not words1 or not words2:
        return 0.0
    
    intersection = words1 & words2
    union = words1 | words2
    
    return len(intersection) / len(union)


def parse_commodity_query(query: str) -> Dict:
    """
    解析商品查询语句
    
    Args:
        query: 用户查询文本，如"给我推荐一款电解质饮料"
        
    Returns:
        解析结果字典
    """
    result = {
        'action': None,  # 'recommend', 'query', 'search'
        'category': None,
        'keywords': []
    }
    
    # 识别动作
    if any(word in query for word in ['推荐', '介绍', '有什么']):
        result['action'] = 'recommend'
    elif any(word in query for word in ['在哪', '位置', '哪里']):
        result['action'] = 'location'
    elif any(word in query for word in ['价格', '多少钱', '贵不贵']):
        result['action'] = 'price'
    else:
        result['action'] = 'query'
    
    # 提取关键词
    result['keywords'] = extract_keywords(query, top_k=3)
    
    # 识别商品类别
    categories = {
        '饮料': ['饮料', '水', '可乐', '茶', '咖啡', '果汁'],
        '零食': ['零食', '薯片', '饼干', '巧克力', '糖果'],
        '日用品': ['日用品', '牙膏', '牙刷', '洗发水', '香皂'],
        '食品': ['食品', '面包', '方便面', '罐头']
    }
    
    for category, keywords in categories.items():
        if any(keyword in query for keyword in keywords):
            result['category'] = category
            break
    
    return result


def format_price(price: float) -> str:
    """
    格式化价格显示
    
    Args:
        price: 价格数值
        
    Returns:
        格式化的价格字符串
    """
    return f"¥{price:.2f}"


def format_response(response_type: str, data: Dict) -> str:
    """
    格式化响应文本
    
    Args:
        response_type: 响应类型
        data: 数据字典
        
    Returns:
        格式化的响应文本
    """
    if response_type == 'commodity_info':
        return f"{data['name']}，价格{format_price(data['price'])}，位于{data['location']}"
    
    elif response_type == 'recommend':
        items = data.get('items', [])
        if not items:
            return "抱歉，暂时没有符合条件的商品。"
        
        response = "为您推荐以下商品：\n"
        for i, item in enumerate(items[:3], 1):
            response += f"{i}. {item['name']}，{format_price(item['price'])}，位于{item['location']}\n"
        return response.strip()
    
    elif response_type == 'bill':
        items = data.get('items', [])
        total = data.get('total', 0)
        response = "您的购物清单：\n"
        for item in items:
            response += f"- {item['name']} x{item['quantity']} = {format_price(item['total'])}\n"
        response += f"\n总计：{format_price(total)}"
        return response
    
    return str(data)


def truncate_text(text: str, max_length: int = 100, suffix: str = '...') -> str:
    """
    截断文本到指定长度
    
    Args:
        text: 原始文本
        max_length: 最大长度
        suffix: 截断后缀
        
    Returns:
        截断后的文本
    """
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix
