"""
AI检测工具
提供商品识别、图像分类、智能推荐等功能
"""

import numpy as np
import logging
import time
import json
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
import random

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProductDetector:
    """商品检测器"""
    
    def __init__(self):
        """初始化商品检测器"""
        self.model_loaded = False
        self.model_path = None
        self.class_names = []
        self.confidence_threshold = 0.7
        self.nms_threshold = 0.4
        
        # 模拟商品数据库
        self.product_database = {
            1: {
                'id': 1,
                'name': '苹果',
                'price': 5.99,
                'category': '水果',
                'icon': '🍎',
                'features': ['红色', '圆形', '水果', '甜'],
                'barcode': '1234567890123',
                'stock': 100,
                'description': '新鲜红富士苹果，口感甜脆多汁'
            },
            2: {
                'id': 2,
                'name': '香蕉',
                'price': 3.99,
                'category': '水果',
                'icon': '🍌',
                'features': ['黄色', '弯曲', '水果', '软糯'],
                'barcode': '1234567890124',
                'stock': 50,
                'description': '新鲜香蕉，营养丰富'
            },
            3: {
                'id': 3,
                'name': '牛奶',
                'price': 12.99,
                'category': '饮品',
                'icon': '🥛',
                'features': ['白色', '液体', '饮品', '营养'],
                'barcode': '1234567890125',
                'stock': 0,
                'description': '纯牛奶，营养丰富'
            },
            4: {
                'id': 4,
                'name': '面包',
                'price': 8.99,
                'category': '食品',
                'icon': '🍞',
                'features': ['棕色', '方形', '食品', '松软'],
                'barcode': '1234567890126',
                'stock': 30,
                'description': '新鲜面包，口感松软'
            },
            5: {
                'id': 5,
                'name': '鸡蛋',
                'price': 15.99,
                'category': '食品',
                'icon': '🥚',
                'features': ['白色', '椭圆形', '食品', '营养'],
                'barcode': '1234567890127',
                'stock': 80,
                'description': '新鲜鸡蛋，营养丰富'
            },
            6: {
                'id': 6,
                'name': '西红柿',
                'price': 4.99,
                'category': '蔬菜',
                'icon': '🍅',
                'features': ['红色', '圆形', '蔬菜', '酸甜'],
                'barcode': '1234567890128',
                'stock': 60,
                'description': '新鲜西红柿，酸甜可口'
            },
            7: {
                'id': 7,
                'name': '胡萝卜',
                'price': 3.99,
                'category': '蔬菜',
                'icon': '🥕',
                'features': ['橙色', '长条形', '蔬菜', '脆'],
                'barcode': '1234567890129',
                'stock': 40,
                'description': '新鲜胡萝卜，口感脆甜'
            },
            8: {
                'id': 8,
                'name': '可乐',
                'price': 2.99,
                'category': '饮品',
                'icon': '🥤',
                'features': ['黑色', '液体', '饮品', '气泡'],
                'barcode': '1234567890130',
                'stock': 120,
                'description': '冰镇可乐，清爽解渴'
            },
            9: {
                'id': 9,
                'name': '薯片',
                'price': 6.99,
                'category': '零食',
                'icon': '🥔',
                'features': ['黄色', '片状', '零食', '脆'],
                'barcode': '1234567890131',
                'stock': 70,
                'description': '香脆薯片，美味零食'
            },
            10: {
                'id': 10,
                'name': '巧克力',
                'price': 9.99,
                'category': '零食',
                'icon': '🍫',
                'features': ['棕色', '块状', '零食', '甜'],
                'barcode': '1234567890132',
                'stock': 90,
                'description': '香浓巧克力，甜蜜享受'
            }
        }
        
        # 加载模型
        self.load_model()
    
    def load_model(self, model_path: str = None):
        """加载AI模型"""
        try:
            if model_path:
                self.model_path = model_path
                # 这里应该加载真实的AI模型
                logger.info(f"正在加载模型: {model_path}")
            
            # 模拟模型加载
            self.model_loaded = True
            self.class_names = list(self.product_database.values())
            
            logger.info("AI模型加载完成")
            
        except Exception as e:
            logger.error(f"模型加载失败: {e}")
            self.model_loaded = False
    
    def detect_products(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """检测图像中的商品"""
        if not self.model_loaded:
            logger.warning("模型未加载，使用模拟检测")
            return self._simulate_detection(image)
        
        try:
            # 这里应该调用真实的AI模型进行检测
            # 现在使用模拟检测
            detections = self._simulate_detection(image)
            
            # 记录检测日志
            for detection in detections:
                self.log_detection(detection)
            
            return detections
            
        except Exception as e:
            logger.error(f"商品检测失败: {e}")
            return []
    
    def _simulate_detection(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """模拟商品检测（实际项目中应替换为真实AI模型）"""
        # 随机检测1-3个商品
        num_detections = np.random.randint(1, 4)
        
        # 随机选择商品
        product_ids = np.random.choice(list(self.product_database.keys()), num_detections, replace=False)
        
        detections = []
        
        for i, product_id in enumerate(product_ids):
            product = self.product_database[product_id]
            
            # 生成随机检测框（相对于图像尺寸的百分比）
            x = np.random.uniform(0.1, 0.7)
            y = np.random.uniform(0.1, 0.7)
            width = np.random.uniform(0.1, 0.3)
            height = np.random.uniform(0.1, 0.3)
            
            detection = {
                'id': product['id'],
                'name': product['name'],
                'price': product['price'],
                'category': product['category'],
                'icon': product['icon'],
                'confidence': np.random.uniform(0.85, 0.99),
                'bbox': {
                    'x': x,
                    'y': y,
                    'width': width,
                    'height': height
                },
                'features': product['features'],
                'barcode': product['barcode'],
                'stock': product['stock'],
                'description': product['description']
            }
            
            detections.append(detection)
        
        return detections
    
    def recognize_product_by_barcode(self, barcode: str) -> Optional[Dict[str, Any]]:
        """通过条形码识别商品"""
        for product in self.product_database.values():
            if product['barcode'] == barcode:
                return product.copy()
        return None
    
    def search_products(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """搜索商品"""
        results = []
        query_lower = query.lower()
        
        for product in self.product_database.values():
            # 搜索商品名称、分类、特征
            search_text = f"{product['name']} {product['category']} {' '.join(product['features'])}".lower()
            
            if query_lower in search_text:
                results.append(product.copy())
                if len(results) >= limit:
                    break
        
        return results
    
    def get_product_recommendations(self, current_product_id: int, limit: int = 5) -> List[Dict[str, Any]]:
        """获取商品推荐"""
        current_product = self.product_database.get(current_product_id)
        if not current_product:
            return []
        
        recommendations = []
        
        # 基于分类推荐同类商品
        for product in self.product_database.values():
            if (product['id'] != current_product_id and 
                product['category'] == current_product['category']):
                recommendations.append(product.copy())
                if len(recommendations) >= limit // 2:
                    break
        
        # 补充其他热门商品
        popular_products = [p for p in self.product_database.values() if p['id'] != current_product_id]
        popular_products.sort(key=lambda x: x['stock'], reverse=True)  # 按库存排序（模拟热门程度）
        
        for product in popular_products:
            if product not in recommendations:
                recommendations.append(product.copy())
                if len(recommendations) >= limit:
                    break
        
        return recommendations
    
    def get_category_stats(self) -> Dict[str, Any]:
        """获取分类统计"""
        stats = {}
        
        for product in self.product_database.values():
            category = product['category']
            if category not in stats:
                stats[category] = {
                    'count': 0,
                    'total_value': 0,
                    'products': []
                }
            
            stats[category]['count'] += 1
            stats[category]['total_value'] += product['price'] * product['stock']
            stats[category]['products'].append(product['name'])
        
        return stats
    
    def log_detection(self, detection: Dict[str, Any]):
        """记录检测日志"""
        try:
            detection_log = {
                'timestamp': datetime.now().isoformat(),
                'product_id': detection['id'],
                'product_name': detection['name'],
                'confidence': detection['confidence'],
                'bbox': detection.get('bbox', {})
            }
            
            # 这里应该写入数据库或日志文件
            logger.info(f"检测记录: {detection_log}")
            
        except Exception as e:
            logger.error(f"记录检测日志失败: {e}")

class AIAssistant:
    """AI助手"""
    
    def __init__(self):
        """初始化AI助手"""
        self.conversation_history = []
        self.max_history = 50
        
        # 预设回复模板
        self.response_templates = {
            'greeting': [
                '您好！我是智能购物助手，有什么可以帮助您的吗？',
                '欢迎！我是您的AI购物助手，请告诉我您需要什么帮助。',
                '您好！欢迎来到智能购物系统，我是您的专属购物助手。'
            ],
            'recommendation': [
                '根据您的购物历史，我推荐您试试{products}，这些都是很受欢迎的商品哦！',
                '基于您的偏好，我认为您可能会喜欢{products}，要不要试试看？',
                '为您推荐几款热门商品：{products}，希望您会喜欢！'
            ],
            'price_inquiry': [
                '您可以查看商品详情了解具体价格，我们保证所有商品价格公道合理！',
                '我们的价格都是透明公开的，您可以在商品页面查看详细信息。',
                '价格信息可以在商品详情页查看，我们承诺提供最优惠的价格。'
            ],
            'promotion': [
                '目前我们有满100减20的活动，还有会员专享折扣，建议您注册会员享受更多优惠！',
                '现在有多项优惠活动进行中，包括新用户优惠、满减活动等，详情可查看活动页面。',
                '会员可享受专属折扣和积分奖励，建议您注册成为我们的会员。'
            ],
            'delivery': [
                '我们提供快速配送服务，一般情况下24小时内送达，满50元免配送费！',
                '配送服务覆盖全市，订单满50元即可享受免费配送，通常24小时内送达。',
                '我们承诺快速配送，正常情况下24小时内送达，满50元免配送费。'
            ],
            'quality': [
                '我们承诺所有商品都是新鲜优质的，如有质量问题可以无条件退换！',
                '所有商品都经过严格质检，保证新鲜优质，如有问题支持7天无理由退换。',
                '我们对商品质量有严格要求，如有任何质量问题都可以无条件退换。'
            ],
            'help': [
                '我可以帮您：商品推荐、价格查询、优惠信息、配送服务、售后支持等。',
                '作为您的购物助手，我可以提供商品推荐、价格查询、活动信息等服务。',
                '您有任何购物相关的问题都可以问我，包括商品推荐、价格咨询、配送信息等。'
            ]
        }
        
        # 关键词映射
        self.keyword_mapping = {
            '推荐': 'recommendation',
            '建议': 'recommendation',
            '价格': 'price_inquiry',
            '多少钱': 'price_inquiry',
            '优惠': 'promotion',
            '折扣': 'promotion',
            '活动': 'promotion',
            '配送': 'delivery',
            '送货': 'delivery',
            '快递': 'delivery',
            '质量': 'quality',
            '品质': 'quality',
            '新鲜': 'quality',
            '帮助': 'help',
            '客服': 'help',
            '人工': 'help'
        }
    
    def chat(self, message: str, user_id: str = None, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """处理聊天消息"""
        try:
            # 清理消息
            message = message.strip()
            
            # 记录对话历史
            self._add_to_history('user', message, user_id)
            
            # 分析消息意图
            intent = self._analyze_intent(message)
            
            # 生成回复
            response = self._generate_response(intent, message, context)
            
            # 记录回复
            self._add_to_history('assistant', response, user_id)
            
            return {
                'success': True,
                'response': response,
                'intent': intent,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"AI聊天处理失败: {e}")
            return {
                'success': False,
                'response': '抱歉，我暂时无法理解您的问题，请稍后再试。',
                'error': str(e)
            }
    
    def _analyze_intent(self, message: str) -> str:
        """分析消息意图"""
        message_lower = message.lower()
        
        # 检查关键词
        for keyword, intent in self.keyword_mapping.items():
            if keyword in message_lower:
                return intent
        
        # 默认意图
        return 'help'
    
    def _generate_response(self, intent: str, message: str, context: Dict[str, Any] = None) -> str:
        """生成回复"""
        # 处理问候语
        greetings = ['你好', '您好', '嗨', 'hello', 'hi']
        if any(greeting in message.lower() for greeting in greetings):
            return np.random.choice(self.response_templates['greeting'])
        
        # 根据意图生成回复
        if intent in self.response_templates:
            templates = self.response_templates[intent]
            response = np.random.choice(templates)
            
            # 替换变量
            if '{products}' in response and context:
                recommendations = context.get('recommendations', [])
                if recommendations:
                    product_names = [p['name'] for p in recommendations[:3]]
                    response = response.replace('{products}', '、'.join(product_names))
            
            return response
        
        # 默认回复
        return np.random.choice(self.response_templates['help'])
    
    def _add_to_history(self, role: str, message: str, user_id: str = None):
        """添加到对话历史"""
        self.conversation_history.append({
            'role': role,
            'message': message,
            'user_id': user_id,
            'timestamp': datetime.now().isoformat()
        })
        
        # 保持历史记录数量
        if len(self.conversation_history) > self.max_history:
            self.conversation_history.pop(0)
    
    def get_conversation_history(self, user_id: str = None, limit: int = 10) -> List[Dict[str, Any]]:
        """获取对话历史"""
        if user_id:
            history = [h for h in self.conversation_history if h.get('user_id') == user_id]
        else:
            history = self.conversation_history.copy()
        
        return history[-limit:]
    
    def clear_history(self, user_id: str = None):
        """清除对话历史"""
        if user_id:
            self.conversation_history = [h for h in self.conversation_history if h.get('user_id') != user_id]
        else:
            self.conversation_history.clear()

# 全局实例
product_detector = ProductDetector()
ai_assistant = AIAssistant()

def init_ai_system():
    """初始化AI系统"""
    try:
        logger.info("正在初始化AI系统...")
        
        # 加载模型
        product_detector.load_model()
        
        logger.info("AI系统初始化完成")
        return True
        
    except Exception as e:
        logger.error(f"AI系统初始化失败: {e}")
        return False

def detect_products_in_image(image_data: np.ndarray) -> List[Dict[str, Any]]:
    """检测图像中的商品"""
    try:
        detections = product_detector.detect_products(image_data)
        return detections
    except Exception as e:
        logger.error(f"商品检测失败: {e}")
        return []

def get_product_recommendations(product_id: int, limit: int = 5) -> List[Dict[str, Any]]:
    """获取商品推荐"""
    try:
        recommendations = product_detector.get_product_recommendations(product_id, limit)
        return recommendations
    except Exception as e:
        logger.error(f"获取商品推荐失败: {e}")
        return []

def chat_with_ai(message: str, user_id: str = None, context: Dict[str, Any] = None) -> Dict[str, Any]:
    """与AI助手聊天"""
    try:
        response = ai_assistant.chat(message, user_id, context)
        return response
    except Exception as e:
        logger.error(f"AI聊天失败: {e}")
        return {
            'success': False,
            'response': '抱歉，我暂时无法理解您的问题，请稍后再试。',
            'error': str(e)
        }

# 导出函数和类
__all__ = [
    'ProductDetector',
    'AIAssistant',
    'product_detector',
    'ai_assistant',
    'init_ai_system',
    'detect_products_in_image',
    'get_product_recommendations',
    'chat_with_ai'
]