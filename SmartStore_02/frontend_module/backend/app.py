from flask import Flask, render_template, jsonify, request, session, redirect, url_for
from flask_cors import CORS
import os
import json
from datetime import datetime, timedelta
import random
import time

# 创建Flask应用
app = Flask(__name__)
app.secret_key = 'your-secret-key-here-change-in-production'
CORS(app)

# 配置
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB

# 确保上传目录存在
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# 模拟数据库
class MockDatabase:
    def __init__(self):
        self.users = [
            {
                'id': 1,
                'username': 'admin',
                'email': 'admin@example.com',
                'password': 'admin123',
                'role': '管理员',
                'status': 'active',
                'created_at': '2024-01-15',
                'last_login': '2024-01-20',
                'avatar': 'A',
                'phone': '13800138000',
                'remark': '超级管理员'
            },
            {
                'id': 2,
                'username': 'manager',
                'email': 'manager@example.com',
                'password': 'manager123',
                'role': '经理',
                'status': 'active',
                'created_at': '2024-01-16',
                'last_login': '2024-01-19',
                'avatar': 'M',
                'phone': '13900139000',
                'remark': '店铺经理'
            }
        ]
        
        self.products = [
            {
                'id': 1,
                'name': '苹果',
                'price': 5.99,
                'category': '水果',
                'stock': 100,
                'status': 'active',
                'created_at': '2024-01-01',
                'icon': '🍎',
                'unit': '个',
                'barcode': '1234567890123',
                'description': '新鲜红富士苹果，口感甜脆'
            },
            {
                'id': 2,
                'name': '香蕉',
                'price': 3.99,
                'category': '水果',
                'stock': 50,
                'status': 'active',
                'created_at': '2024-01-02',
                'icon': '🍌',
                'unit': '斤',
                'barcode': '1234567890124',
                'description': '新鲜香蕉，营养丰富'
            },
            {
                'id': 3,
                'name': '牛奶',
                'price': 12.99,
                'category': '饮品',
                'stock': 0,
                'status': 'active',
                'created_at': '2024-01-03',
                'icon': '🥛',
                'unit': '瓶',
                'barcode': '1234567890125',
                'description': '纯牛奶，营养丰富'
            }
        ]
        
        self.orders = [
            {
                'id': 'ORDER_001',
                'customer': '张三',
                'amount': 25.98,
                'status': 'paid',
                'created_at': '2024-01-20 10:30',
                'items': ['苹果', '香蕉'],
                'payment_method': '微信支付',
                'payment_time': '2024-01-20 10:31',
                'transaction_id': 'WX202401201030250001'
            },
            {
                'id': 'ORDER_002',
                'customer': '李四',
                'amount': 12.99,
                'status': 'unpaid',
                'created_at': '2024-01-20 11:15',
                'items': ['牛奶'],
                'payment_method': '',
                'payment_time': '',
                'transaction_id': ''
            }
        ]
        
        self.traffic_data = {
            'today_entered': 156,
            'today_left': 134,
            'today_total': 287,
            'week_total': 1847,
            'month_total': 12560
        }

# 初始化数据库
db = MockDatabase()

# 路由注册
@app.route('/')
def index():
    """主页路由"""
    return redirect(url_for('client'))

@app.route('/client')
def client():
    """客户端页面"""
    return render_template('client/index.html')

@app.route('/admin')
def admin():
    """管理后台重定向"""
    return redirect(url_for('admin_login'))

@app.route('/admin/login')
def admin_login():
    """管理员登录页面"""
    return render_template('admin/login.html')

@app.route('/admin/dashboard')
def admin_dashboard():
    """仪表盘页面"""
    if 'user_id' not in session:
        return redirect(url_for('admin_login'))
    return render_template('admin/dashboard.html')

@app.route('/admin/traffic')
def admin_traffic():
    """人流量监控页面"""
    if 'user_id' not in session:
        return redirect(url_for('admin_login'))
    return render_template('admin/traffic.html')

@app.route('/admin/inventory')
def admin_inventory():
    """库存管理页面"""
    if 'user_id' not in session:
        return redirect(url_for('admin_login'))
    return render_template('admin/inventory.html')

@app.route('/admin/users')
def admin_users():
    """用户管理页面"""
    if 'user_id' not in session:
        return redirect(url_for('admin_login'))
    return render_template('admin/users.html')

@app.route('/admin/orders')
def admin_orders():
    """交易记录页面"""
    if 'user_id' not in session:
        return redirect(url_for('admin_login'))
    return render_template('admin/orders.html')

@app.route('/admin/products')
def admin_products():
    """商品管理页面"""
    if 'user_id' not in session:
        return redirect(url_for('admin_login'))
    return render_template('admin/products.html')

# API路由
@app.route('/api/login', methods=['POST'])
def api_login():
    """用户登录API"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    # 验证用户
    user = None
    for u in db.users:
        if u['username'] == username and u['password'] == password:
            user = u
            break
    
    if user:
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['role'] = user['role']
        
        return jsonify({
            'success': True,
            'message': '登录成功',
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'role': user['role']
            }
        })
    else:
        return jsonify({
            'success': False,
            'message': '用户名或密码错误'
        }), 401

@app.route('/api/logout', methods=['POST'])
def api_logout():
    """用户登出API"""
    session.clear()
    return jsonify({
        'success': True,
        'message': '登出成功'
    })

@app.route('/api/register', methods=['POST'])
def api_register():
    """用户注册API"""
    data = request.get_json()
    
    # 检查用户名是否已存在
    for user in db.users:
        if user['username'] == data['username']:
            return jsonify({
                'success': False,
                'message': '用户名已存在'
            }), 400
    
    # 创建新用户
    new_user = {
        'id': len(db.users) + 1,
        'username': data['username'],
        'email': data['email'],
        'password': data['password'],
        'role': data.get('role', '普通用户'),
        'status': 'active',
        'created_at': datetime.now().strftime('%Y-%m-%d'),
        'last_login': datetime.now().strftime('%Y-%m-%d'),
        'avatar': data['username'][0].upper(),
        'phone': data.get('phone', ''),
        'remark': data.get('remark', '')
    }
    
    db.users.append(new_user)
    
    return jsonify({
        'success': True,
        'message': '注册成功',
        'user': {
            'id': new_user['id'],
            'username': new_user['username'],
            'email': new_user['email']
        }
    })

@app.route('/api/products')
def api_products():
    """获取商品列表API"""
    category = request.args.get('category', 'all')
    status = request.args.get('status', 'all')
    search = request.args.get('search', '')
    
    products = db.products.copy()
    
    # 分类过滤
    if category != 'all':
        products = [p for p in products if p['category'] == category]
    
    # 状态过滤
    if status != 'all':
        products = [p for p in products if p['status'] == status]
    
    # 搜索过滤
    if search:
        products = [p for p in products if search.lower() in p['name'].lower()]
    
    return jsonify({
        'success': True,
        'products': products,
        'total': len(products)
    })

@app.route('/api/products/<int:product_id>')
def api_product_detail(product_id):
    """获取商品详情API"""
    product = None
    for p in db.products:
        if p['id'] == product_id:
            product = p
            break
    
    if product:
        return jsonify({
            'success': True,
            'product': product
        })
    else:
        return jsonify({
            'success': False,
            'message': '商品不存在'
        }), 404

@app.route('/api/products', methods=['POST'])
def api_add_product():
    """添加商品API"""
    data = request.get_json()
    
    new_product = {
        'id': len(db.products) + 1,
        'name': data['name'],
        'price': float(data['price']),
        'category': data['category'],
        'stock': int(data['stock']),
        'status': data.get('status', 'active'),
        'created_at': datetime.now().strftime('%Y-%m-%d'),
        'icon': data.get('icon', ''),
        'unit': data.get('unit', '个'),
        'barcode': data.get('barcode', ''),
        'description': data.get('description', '')
    }
    
    db.products.append(new_product)
    
    return jsonify({
        'success': True,
        'message': '商品添加成功',
        'product': new_product
    })

@app.route('/api/products/<int:product_id>', methods=['PUT'])
def api_update_product(product_id):
    """更新商品API"""
    data = request.get_json()
    
    product = None
    for p in db.products:
        if p['id'] == product_id:
            product = p
            break
    
    if not product:
        return jsonify({
            'success': False,
            'message': '商品不存在'
        }), 404
    
    # 更新商品信息
    product['name'] = data.get('name', product['name'])
    product['price'] = float(data.get('price', product['price']))
    product['category'] = data.get('category', product['category'])
    product['stock'] = int(data.get('stock', product['stock']))
    product['status'] = data.get('status', product['status'])
    product['icon'] = data.get('icon', product['icon'])
    product['unit'] = data.get('unit', product['unit'])
    product['barcode'] = data.get('barcode', product['barcode'])
    product['description'] = data.get('description', product['description'])
    
    return jsonify({
        'success': True,
        'message': '商品更新成功',
        'product': product
    })

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
def api_delete_product(product_id):
    """删除商品API"""
    product = None
    for p in db.products:
        if p['id'] == product_id:
            product = p
            break
    
    if not product:
        return jsonify({
            'success': False,
            'message': '商品不存在'
        }), 404
    
    db.products.remove(product)
    
    return jsonify({
        'success': True,
        'message': '商品删除成功'
    })

@app.route('/api/users')
def api_users():
    """获取用户列表API"""
    role = request.args.get('role', 'all')
    status = request.args.get('status', 'all')
    search = request.args.get('search', '')
    
    users = db.users.copy()
    
    # 角色过滤
    if role != 'all':
        users = [u for u in users if u['role'] == role]
    
    # 状态过滤
    if status != 'all':
        users = [u for u in users if u['status'] == status]
    
    # 搜索过滤
    if search:
        users = [u for u in users if search.lower() in u['username'].lower() or search.lower() in u['email'].lower()]
    
    return jsonify({
        'success': True,
        'users': users,
        'total': len(users)
    })

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def api_update_user(user_id):
    """更新用户API"""
    data = request.get_json()
    
    user = None
    for u in db.users:
        if u['id'] == user_id:
            user = u
            break
    
    if not user:
        return jsonify({
            'success': False,
            'message': '用户不存在'
        }), 404
    
    # 更新用户信息
    user['username'] = data.get('username', user['username'])
    user['email'] = data.get('email', user['email'])
    user['role'] = data.get('role', user['role'])
    user['status'] = data.get('status', user['status'])
    user['phone'] = data.get('phone', user['phone'])
    user['remark'] = data.get('remark', user['remark'])
    
    return jsonify({
        'success': True,
        'message': '用户更新成功',
        'user': user
    })

@app.route('/api/orders')
def api_orders():
    """获取订单列表API"""
    status = request.args.get('status', 'all')
    date_filter = request.args.get('date', 'all')
    search = request.args.get('search', '')
    
    orders = db.orders.copy()
    
    # 状态过滤
    if status != 'all':
        orders = [o for o in orders if o['status'] == status]
    
    # 搜索过滤
    if search:
        orders = [o for o in orders if search.lower() in o['id'].lower() or search.lower() in o['customer'].lower()]
    
    return jsonify({
        'success': True,
        'orders': orders,
        'total': len(orders)
    })

@app.route('/api/orders/<order_id>', methods=['PUT'])
def api_update_order(order_id):
    """更新订单API"""
    data = request.get_json()
    
    order = None
    for o in db.orders:
        if o['id'] == order_id:
            order = o
            break
    
    if not order:
        return jsonify({
            'success': False,
            'message': '订单不存在'
        }), 404
    
    # 更新订单状态
    if 'status' in data:
        order['status'] = data['status']
        if data['status'] == 'paid':
            order['payment_time'] = datetime.now().strftime('%Y-%m-%d %H:%M')
    
    return jsonify({
        'success': True,
        'message': '订单更新成功',
        'order': order
    })

@app.route('/api/traffic')
def api_traffic():
    """获取人流量数据API"""
    return jsonify({
        'success': True,
        'data': db.traffic_data
    })

@app.route('/api/stats/dashboard')
def api_dashboard_stats():
    """获取仪表盘统计数据API"""
    stats = {
        'today_sales': 12580.50,
        'today_orders': 156,
        'total_users': len(db.users),
        'total_products': len(db.products),
        'sales_change': 12.5,
        'orders_change': 8.3,
        'users_change': 5.2,
        'products_change': 15.8,
        'online_users': random.randint(30, 50),
        'today_detections': 1234,
        'detection_rate': 94.7,
        'response_time': 0.3
    }
    
    return jsonify({
        'success': True,
        'stats': stats
    })

@app.route('/api/camera/start', methods=['POST'])
def api_start_camera():
    """启动摄像头API"""
    # 模拟摄像头启动
    time.sleep(1)
    return jsonify({
        'success': True,
        'message': '摄像头已启动',
        'stream_url': '/api/camera/stream'
    })

@app.route('/api/camera/stop', methods=['POST'])
def api_stop_camera():
    """停止摄像头API"""
    return jsonify({
        'success': True,
        'message': '摄像头已停止'
    })

@app.route('/api/camera/detect', methods=['POST'])
def api_detect_product():
    """商品识别API"""
    # 模拟商品识别
    time.sleep(0.5)
    
    # 随机返回一个商品
    product = random.choice(db.products)
    
    return jsonify({
        'success': True,
        'product': {
            'id': product['id'],
            'name': product['name'],
            'price': product['price'],
            'icon': product['icon'],
            'confidence': random.uniform(0.9, 0.99)
        }
    })

@app.route('/api/cart/add', methods=['POST'])
def api_add_to_cart():
    """添加到购物车API"""
    data = request.get_json()
    
    return jsonify({
        'success': True,
        'message': '商品已添加到购物车',
        'item': {
            'id': data['product_id'],
            'name': data['name'],
            'price': data['price'],
            'quantity': data.get('quantity', 1)
        }
    })

@app.route('/api/checkout', methods=['POST'])
def api_checkout():
    """结算API"""
    data = request.get_json()
    
    # 模拟支付处理
    time.sleep(2)
    
    return jsonify({
        'success': True,
        'message': '支付成功',
        'order_id': 'ORDER_' + str(int(time.time())),
        'amount': data['total_amount'],
        'payment_method': data['payment_method']
    })

@app.route('/api/ai/chat', methods=['POST'])
def api_ai_chat():
    """AI聊天API"""
    data = request.get_json()
    message = data.get('message', '')
    
    # 简单的AI回复逻辑
    responses = {
        '推荐': '根据您的购物历史，我推荐您试试酸奶、饼干和橙子，这些都是很受欢迎的商品哦！',
        '价格': '您可以查看商品详情了解具体价格，我们保证所有商品价格公道合理！',
        '优惠': '目前我们有满100减20的活动，还有会员专享折扣，建议您注册会员享受更多优惠！',
        '配送': '我们提供快速配送服务，一般情况下24小时内送达，满50元免配送费！',
        '质量': '我们承诺所有商品都是新鲜优质的，如有质量问题可以无条件退换！'
    }
    
    response = '感谢您的咨询！我是AI购物助手，可以为您提供商品推荐、价格查询、优惠信息等服务。'
    
    for key in responses:
        if key in message:
            response = responses[key]
            break
    
    return jsonify({
        'success': True,
        'response': response
    })

# 错误处理
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'message': '页面不存在'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'message': '服务器内部错误'
    }), 500

# 使用Flask默认的静态文件与模板目录：
# - 模板: backend/templates
# - 静态: backend/static
# 自定义的静态路径路由已移除，统一通过 url_for('static', filename=...) 提供资源

# 主程序
if __name__ == '__main__':
    # 设置静态文件目录
    app.static_folder = 'static'
    
    # 启动应用
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        threaded=True
    )