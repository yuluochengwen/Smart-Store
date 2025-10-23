"""
客户端相关路由
处理商品识别、购物车、AI助手等功能
"""

from flask import request, jsonify, session
from ..utils.database import db_manager, log_system_event
from ..utils.camera import camera_manager, object_detector
from ..utils.ai_detection import detect_products_in_image, get_product_recommendations, chat_with_ai
from ..routes import client_bp

@client_bp.route('/camera/start', methods=['POST'])
def start_camera():
    """启动摄像头"""
    try:
        # 这里应该调用真实的摄像头管理器
        # 现在只是模拟
        log_system_event('INFO', 'client', '摄像头启动请求')
        
        return jsonify({
            'success': True,
            'message': '摄像头已启动',
            'stream_url': '/client/camera/stream'
        })
        
    except Exception as e:
        log_system_event('ERROR', 'client', f'摄像头启动失败: {str(e)}')
        return jsonify({
            'success': False,
            'message': '摄像头启动失败'
        }), 500

@client_bp.route('/camera/stop', methods=['POST'])
def stop_camera():
    """停止摄像头"""
    try:
        log_system_event('INFO', 'client', '摄像头停止请求')
        
        return jsonify({
            'success': True,
            'message': '摄像头已停止'
        })
        
    except Exception as e:
        log_system_event('ERROR', 'client', f'摄像头停止失败: {str(e)}')
        return jsonify({
            'success': False,
            'message': '摄像头停止失败'
        }), 500

@client_bp.route('/detect', methods=['POST'])
def detect_products():
    """商品检测"""
    try:
        # 这里应该处理真实的图像数据
        # 现在使用模拟检测
        
        # 模拟检测结果
        detections = [
            {
                'id': 1,
                'name': '苹果',
                'price': 5.99,
                'icon': '🍎',
                'confidence': 0.95,
                'bbox': {
                    'x': 100,
                    'y': 150,
                    'width': 200,
                    'height': 180
                }
            },
            {
                'id': 2,
                'name': '香蕉',
                'price': 3.99,
                'icon': '🍌',
                'confidence': 0.92,
                'bbox': {
                    'x': 350,
                    'y': 120,
                    'width': 150,
                    'height': 100
                }
            }
        ]
        
        log_system_event('INFO', 'client', f'检测到 {len(detections)} 个商品')
        
        return jsonify({
            'success': True,
            'detections': detections
        })
        
    except Exception as e:
        log_system_event('ERROR', 'client', f'商品检测失败: {str(e)}')
        return jsonify({
            'success': False,
            'message': '商品检测失败'
        }), 500

@client_bp.route('/cart/add', methods=['POST'])
def add_to_cart():
    """添加到购物车"""
    try:
        data = request.get_json()
        product_id = data.get('product_id')
        name = data.get('name')
        price = data.get('price')
        icon = data.get('icon')
        quantity = data.get('quantity', 1)
        
        if not all([product_id, name, price]):
            return jsonify({
                'success': False,
                'message': '商品信息不完整'
            }), 400
        
        # 这里应该将商品添加到购物车
        # 现在只是记录日志
        log_system_event('INFO', 'client', f'添加到购物车: {name} x{quantity}')
        
        return jsonify({
            'success': True,
            'message': '已添加到购物车',
            'item': {
                'product_id': product_id,
                'name': name,
                'price': price,
                'icon': icon,
                'quantity': quantity
            }
        })
        
    except Exception as e:
        log_system_event('ERROR', 'client', f'添加到购物车失败: {str(e)}')
        return jsonify({
            'success': False,
            'message': '添加到购物车失败'
        }), 500

@client_bp.route('/cart/remove', methods=['POST'])
def remove_from_cart():
    """从购物车移除"""
    try:
        data = request.get_json()
        product_id = data.get('product_id')
        
        if not product_id:
            return jsonify({
                'success': False,
                'message': '商品ID不能为空'
            }), 400
        
        log_system_event('INFO', 'client', f'从购物车移除: 商品ID {product_id}')
        
        return jsonify({
            'success': True,
            'message': '已从购物车移除'
        })
        
    except Exception as e:
        log_system_event('ERROR', 'client', f'移除商品失败: {str(e)}')
        return jsonify({
            'success': False,
            'message': '移除商品失败'
        }), 500

@client_bp.route('/cart/update', methods=['POST'])
def update_cart_item():
    """更新购物车商品"""
    try:
        data = request.get_json()
        product_id = data.get('product_id')
        quantity = data.get('quantity')
        
        if not all([product_id, quantity is not None]):
            return jsonify({
                'success': False,
                'message': '参数不完整'
            }), 400
        
        log_system_event('INFO', 'client', f'更新购物车: 商品ID {product_id}, 数量 {quantity}')
        
        return jsonify({
            'success': True,
            'message': '购物车已更新'
        })
        
    except Exception as e:
        log_system_event('ERROR', 'client', f'更新购物车失败: {str(e)}')
        return jsonify({
            'success': False,
            'message': '更新购物车失败'
        }), 500

@client_bp.route('/cart/clear', methods=['POST'])
def clear_cart():
    """清空购物车"""
    try:
        log_system_event('INFO', 'client', '清空购物车')
        
        return jsonify({
            'success': True,
            'message': '购物车已清空'
        })
        
    except Exception as e:
        log_system_event('ERROR', 'client', f'清空购物车失败: {str(e)}')
        return jsonify({
            'success': False,
            'message': '清空购物车失败'
        }), 500

@client_bp.route('/checkout', methods=['POST'])
def checkout():
    """结算"""
    try:
        data = request.get_json()
        items = data.get('items', [])
        total_amount = data.get('total_amount', 0)
        payment_method = data.get('payment_method', 'wechat')
        customer_info = data.get('customer_info', {})
        
        if not items or total_amount <= 0:
            return jsonify({
                'success': False,
                'message': '订单信息不完整'
            }), 400
        
        # 生成订单号
        import time
        order_id = f"ORDER_{int(time.time())}"
        
        # 创建订单
        order_data = {
            'id': order_id,
            'customer_name': customer_info.get('name', '匿名用户'),
            'customer_phone': customer_info.get('phone', ''),
            'customer_address': customer_info.get('address', ''),
            'amount': total_amount,
            'status': 'paid',
            'payment_method': payment_method,
            'payment_time': datetime.now().isoformat(),
            'transaction_id': f"TXN_{order_id}"
        }
        
        # 保存订单
        db_manager.insert_data('orders', order_data)
        
        # 保存订单商品
        for item in items:
            item_data = {
                'order_id': order_id,
                'product_id': item.get('product_id', 0),
                'product_name': item.get('name', ''),
                'price': item.get('price', 0),
                'quantity': item.get('quantity', 1),
                'subtotal': item.get('price', 0) * item.get('quantity', 1)
            }
            db_manager.insert_data('order_items', item_data)
        
        log_system_event('INFO', 'client', f'订单结算成功: {order_id}, 金额: ¥{total_amount}')
        
        return jsonify({
            'success': True,
            'message': '支付成功',
            'order_id': order_id,
            'amount': total_amount,
            'payment_method': payment_method
        })
        
    except Exception as e:
        log_system_event('ERROR', 'client', f'结算失败: {str(e)}')
        return jsonify({
            'success': False,
            'message': '支付失败，请稍后重试'
        }), 500

@client_bp.route('/recommendations', methods=['GET'])
def get_recommendations():
    """获取商品推荐"""
    try:
        product_id = request.args.get('product_id', type=int)
        limit = request.args.get('limit', 5, type=int)
        
        # 获取推荐商品
        recommendations = get_product_recommendations(product_id, limit)
        
        return jsonify({
            'success': True,
            'recommendations': recommendations
        })
        
    except Exception as e:
        log_system_event('ERROR', 'client', f'获取推荐失败: {str(e)}')
        return jsonify({
            'success': False,
            'message': '获取推荐失败'
        }), 500

@client_bp.route('/ai/chat', methods=['POST'])
def ai_chat():
    """AI聊天"""
    try:
        data = request.get_json()
        message = data.get('message', '')
        user_id = session.get('user_id')
        
        if not message:
            return jsonify({
                'success': False,
                'message': '请输入消息'
            }), 400
        
        # 构建上下文
        context = {
            'recommendations': get_product_recommendations(1, 3)  # 示例推荐
        }
        
        # 与AI助手聊天
        response = chat_with_ai(message, user_id, context)
        
        return jsonify(response)
        
    except Exception as e:
        log_system_event('ERROR', 'client', f'AI聊天失败: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'AI助手暂时无法回复，请稍后再试'
        }), 500

@client_bp.route('/stats', methods=['GET'])
def get_client_stats():
    """获取客户端统计信息"""
    try:
        # 获取今日检测次数
        today = datetime.now().strftime('%Y-%m-%d')
        detection_count = db_manager.execute_query(
            "SELECT COUNT(*) as count FROM detection_logs WHERE DATE(created_at) = ?",
            (today,)
        )
        
        # 获取今日订单数
        order_count = db_manager.execute_query(
            "SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = ?",
            (today,)
        )
        
        # 获取今日收入
        revenue = db_manager.execute_query(
            "SELECT SUM(amount) as total FROM orders WHERE DATE(created_at) = ? AND status = 'paid'",
            (today,)
        )
        
        stats = {
            'today_detections': detection_count[0]['count'] if detection_count else 0,
            'today_orders': order_count[0]['count'] if order_count else 0,
            'today_revenue': revenue[0]['total'] if revenue and revenue[0]['total'] else 0,
            'success_rate': 94.7,
            'online_users': 42
        }
        
        return jsonify({
            'success': True,
            'stats': stats
        })
        
    except Exception as e:
        log_system_event('ERROR', 'client', f'获取统计信息失败: {str(e)}')
        return jsonify({
            'success': False,
            'message': '获取统计信息失败'
        }), 500

# 导入必要的模块
from datetime import datetime