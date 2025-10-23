"""
管理端相关路由
处理仪表盘、用户管理、商品管理、订单管理等功能
"""

from flask import request, jsonify, session
from datetime import datetime, timedelta
from ..utils.database import db_manager, log_system_event
from ..utils.camera import traffic_counter
from ..utils.ai_detection import get_category_stats
from ..routes import admin_bp
from ..routes.auth import admin_required

@admin_bp.route('/dashboard/stats')
@admin_required
def dashboard_stats():
    """获取仪表盘统计数据"""
    try:
        # 获取数据库统计
        db_stats = db_manager.execute_query("""
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM products) as total_products,
                (SELECT COUNT(*) FROM orders) as total_orders,
                (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = DATE('now')) as today_orders,
                (SELECT SUM(amount) FROM orders WHERE DATE(created_at) = DATE('now') AND status = 'paid') as today_revenue,
                (SELECT COUNT(*) FROM orders WHERE status = 'paid') as paid_orders,
                (SELECT COUNT(*) FROM orders WHERE status = 'unpaid') as unpaid_orders
        """)
        
        stats = db_stats[0] if db_stats else {}
        
        # 获取人流量统计
        traffic_stats = traffic_counter.get_daily_stats()
        
        # 获取商品分类统计
        category_stats = get_category_stats()
        
        # 获取系统状态
        system_status = {
            'camera_status': 'online',
            'ai_status': 'online',
            'database_status': 'online',
            'server_status': 'online'
        }
        
        return jsonify({
            'success': True,
            'stats': {
                'users': stats.get('total_users', 0),
                'products': stats.get('total_products', 0),
                'orders': stats.get('total_orders', 0),
                'today_orders': stats.get('today_orders', 0),
                'today_revenue': stats.get('today_revenue', 0) or 0,
                'paid_orders': stats.get('paid_orders', 0),
                'unpaid_orders': stats.get('unpaid_orders', 0),
                'traffic': traffic_stats,
                'categories': category_stats
            },
            'system_status': system_status
        })
        
    except Exception as e:
        log_system_event('ERROR', 'admin', f'获取仪表盘统计失败: {str(e)}')
        return jsonify({
            'success': False,
            'message': '获取统计数据失败'
        }), 500

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    """获取用户列表"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        search = request.args.get('search', '')
        role = request.args.get('role', 'all')
        status = request.args.get('status', 'all')
        
        # 构建查询条件
        where_conditions = []
        params = []
        
        if search:
            where_conditions.append("(username LIKE ? OR email LIKE ?)")
            search_param = f'%{search}%'
            params.extend([search_param, search_param])
        
        if role != 'all':
            where_conditions.append("role = ?")
            params.append(role)
        
        if status != 'all':
            where_conditions.append("status = ?")
            params.append(status)
        
        where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
        
        # 获取总数
        count_query = f"SELECT COUNT(*) as total FROM users WHERE {where_clause}"
        total_result = db_manager.execute_query(count_query, params)
        total = total_result[0]['total'] if total_result else 0
        
        # 获取分页数据
        offset = (page - 1) * per_page
        query = f"""
            SELECT id, username, email, role, status, avatar, phone, remark, created_at, last_login
            FROM users 
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        """
        params.extend([per_page, offset])
        
        users = db_manager.execute_query(query, params)
        
        return jsonify({
            'success': True,
            'users': users,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        log_system_event('ERROR', 'admin', f'获取用户列表失败: {str(e)}')
        return jsonify({
            'success': False,
            'message': '获取用户列表失败'
        }), 500

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    """更新用户信息"""
    try:
        data = request.get_json()
        
        # 构建更新数据
        update_data = {}
        allowed_fields = ['username', 'email', 'role', 'status', 'phone', 'remark']
        
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        if not update_data:
            return jsonify({
                'success': False,
                'message': '没有要更新的数据'
            }), 400
        
        # 更新数据
        rows_affected = db_manager.update_data(
            'users',
            update_data,
            'id = ?',
            (user_id,)
        )
        
        if rows_affected > 0:
            log_system_event('INFO', 'admin', f'用户更新成功 - ID: {user_id}')
            return jsonify({
                'success': True,
                'message': '用户更新成功'
            })
        else:
            return jsonify({
                'success': False,
                'message': '用户不存在或更新失败'
            }), 404
            
    except Exception as e:
        log_system_event('ERROR', 'admin', f'更新用户失败: {str(e)}')
        return jsonify({
            'success': False,
            'message': '更新用户失败'
        }), 500

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    """删除用户"""
    try:
        # 检查是否是管理员本人
        if user_id == session.get('user_id'):
            return jsonify({
                'success': False,
                'message': '不能删除自己的账户'
            }), 400
        
        # 删除用户
        rows_affected = db_manager.delete_data(
            'users',
            'id = ?',
            (user_id,)
        )
        
        if rows_affected > 0:
            log_system_event('INFO', 'admin', f'用户删除成功 - ID: {user_id}')
            return jsonify({
                'success': True,
                'message': '用户删除成功'
            })
        else:
            return jsonify({
                'success': False,
                'message': '用户不存在'
            }), 404
            
    except Exception as e:
        log_system_event('ERROR', 'admin', f'删除用户失败: {str(e)}')
        return jsonify({
            'success': False,
            'message': '删除用户失败'
        }), 500

@admin_bp.route('/products', methods=['GET'])
@admin_required
def get_products():
    """获取商品列表"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        search = request.args.get('search', '')
        category = request.args.get('category', 'all')
        status = request.args.get('status', 'all')
        
        # 构建查询条件
        where_conditions = []
        params = []
        
        if search:
            where_conditions.append("(name LIKE ? OR description LIKE ?)")
            search_param = f'%{search}%'
            params.extend([search_param, search_param])
        
        if category != 'all':
            where_conditions.append("category = ?")
            params.append(category)
        
        if status != 'all':
            where_conditions.append("status = ?")
            params.append(status)
        
        where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
        
        # 获取总数
        count_query = f"SELECT COUNT(*) as total FROM products WHERE {where_clause}"
        total_result = db_manager.execute_query(count_query, params)
        total = total_result[0]['total'] if total_result else 0
        
        # 获取分页数据
        offset = (page - 1) * per_page
        query = f"""
            SELECT id, name, price, category, stock, status, icon, unit, barcode, description, created_at
            FROM products 
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        """
        params.extend([per_page, offset])
        
        products = db_manager.execute_query(query, params)
        
        return jsonify({
            'success': True,
            'products': products,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        log_system_event('ERROR', 'admin', f'获取商品列表失败: {str(e)}')
        return jsonify({
            'success': False,
            'message': '获取商品列表失败'
        }), 500

@admin_bp.route('/products', methods=['POST'])
@admin_required
def create_product():
    """创建商品"""
    try:
        data = request.get_json()
        
        # 验证必填字段
        required_fields = ['name', 'price', 'category', 'stock']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'缺少必填字段: {field}'
                }), 400
        
        # 构建商品数据
        product_data = {
            'name': data['name'],
            'price': float(data['price']),
            'category': data['category'],
            'stock': int(data['stock']),
            'status': data.get('status', 'active'),
            'icon': data.get('icon', ''),
            'unit': data.get('unit', '个'),
            'barcode': data.get('barcode', ''),
            'description': data.get('description', '')
        }
        
        # 插入数据
        product_id = db_manager.insert_data('products', product_data)
        
        if product_id:
            log_system_event('INFO', 'admin', f'商品创建成功 - ID: {product_id}, 名称: {data["name"]}')
            return jsonify({
                'success': True,
                'message': '商品创建成功',
                'product_id': product_id
            })
        else:
            return jsonify({
                'success': False,
                'message': '商品创建失败'
            }), 500
            
    except Exception as e:
        log_system_event('ERROR', 'admin', f'创建商品失败: {str(e)}')
        return jsonify({
            'success': False,
            'message': '创建商品失败'
        }), 500

@admin_bp.route('/products/<int:product_id>', methods=['PUT'])
@admin_required
def update_product(product_id):
    """更新商品"""
    try:
        data = request.get_json()
        
        # 构建更新数据
        update_data = {}
        allowed_fields = ['name', 'price', 'category', 'stock', 'status', 'icon', 'unit', 'barcode', 'description']
        
        for field in allowed_fields:
            if field in data:
                if field in ['price']:
                    update_data[field] = float(data[field])
                elif field in ['stock']:
                    update_data[field] = int(data[field])
                else:
                    update_data[field] = data[field]
        
        if not update_data:
            return jsonify({
                'success': False,
                'message': '没有要更新的数据'
            }), 400
        
        # 更新数据
        rows_affected = db_manager.update_data(
            'products',
            update_data,
            'id = ?',
            (product_id,)
        )
        
        if rows_affected > 0:
            log_system_event('INFO', 'admin', f'商品更新成功 - ID: {product_id}')
            return jsonify({
                'success': True,
                'message': '商品更新成功'
            })
        else:
            return jsonify({
                'success': False,
                'message': '商品不存在或更新失败'
            }), 404
            
    except Exception as e:
        log_system_event('ERROR', 'admin', f'更新商品失败: {str(e)}')
        return jsonify({
            'success': False,
            'message': '更新商品失败'
        }), 500

@admin_bp.route('/products/<int:product_id>', methods=['DELETE'])
@admin_required
def delete_product(product_id):
    """删除商品"""
    try:
        # 删除商品
        rows_affected = db_manager.delete_data(
            'products',
            'id = ?',
            (product_id,)
        )
        
        if rows_affected > 0:
            log_system_event('INFO', 'admin', f'商品删除成功 - ID: {product_id}')
            return jsonify({
                'success': True,
                'message': '商品删除成功'
            })
        else:
            return jsonify({
                'success': False,
                'message': '商品不存在'
            }), 404
            
    except Exception as e:
        log_system_event('ERROR', 'admin', f'删除商品失败: {str(e)}')
        return jsonify({
            'success': False,
            'message': '删除商品失败'
        }), 500

@admin_bp.route('/orders', methods=['GET'])
@admin_required
def get_orders():
    """获取订单列表"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        status = request.args.get('status', 'all')
        search = request.args.get('search', '')
        
        # 构建查询条件
        where_conditions = []
        params = []
        
        if search:
            where_conditions.append("(id LIKE ? OR customer_name LIKE ?)")
            search_param = f'%{search}%'
            params.extend([search_param, search_param])
        
        if status != 'all':
            where_conditions.append("status = ?")
            params.append(status)
        
        where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
        
        # 获取总数
        count_query = f"SELECT COUNT(*) as total FROM orders WHERE {where_clause}"
        total_result = db_manager.execute_query(count_query, params)
        total = total_result[0]['total'] if total_result else 0
        
        # 获取分页数据
        offset = (page - 1) * per_page
        query = f"""
            SELECT id, customer_name, customer_phone, amount, status, payment_method, 
                   payment_time, transaction_id, created_at
            FROM orders 
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        """
        params.extend([per_page, offset])
        
        orders = db_manager.execute_query(query, params)
        
        # 获取订单商品
        for order in orders:
            order_items = db_manager.execute_query(
                "SELECT product_name, quantity, price FROM order_items WHERE order_id = ?",
                (order['id'],)
            )
            order['items'] = order_items
        
        return jsonify({
            'success': True,
            'orders': orders,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        log_system_event('ERROR', 'admin', f'获取订单列表失败: {str(e)}')
        return jsonify({
            'success': False,
            'message': '获取订单列表失败'
        }), 500

@admin_bp.route('/orders/<order_id>', methods=['PUT'])
@admin_required
def update_order(order_id):
    """更新订单"""
    try:
        data = request.get_json()
        
        # 构建更新数据
        update_data = {}
        if 'status' in data:
            update_data['status'] = data['status']
            if data['status'] == 'paid':
                update_data['payment_time'] = datetime.now().isoformat()
        
        if not update_data:
            return jsonify({
                'success': False,
                'message': '没有要更新的数据'
            }), 400
        
        # 更新数据
        rows_affected = db_manager.update_data(
            'orders',
            update_data,
            'id = ?',
            (order_id,)
        )
        
        if rows_affected > 0:
            log_system_event('INFO', 'admin', f'订单更新成功 - ID: {order_id}')
            return jsonify({
                'success': True,
                'message': '订单更新成功'
            })
        else:
            return jsonify({
                'success': False,
                'message': '订单不存在或更新失败'
            }), 404
            
    except Exception as e:
        log_system_event('ERROR', 'admin', f'更新订单失败: {str(e)}')
        return jsonify({
            'success': False,
            'message': '更新订单失败'
        }), 500

@admin_bp.route('/traffic/stats')
@admin_required
def traffic_stats():
    """获取人流量统计"""
    try:
        # 获取今日人流量
        today = datetime.now().strftime('%Y-%m-%d')
        
        # 获取今日人流量数据
        today_traffic = db_manager.execute_query("""
            SELECT 
                SUM(CASE WHEN event_type = 'enter' THEN person_count ELSE 0 END) as entered,
                SUM(CASE WHEN event_type = 'leave' THEN person_count ELSE 0 END) as left
            FROM traffic_logs 
            WHERE DATE(timestamp) = ?
        """, (today,))
        
        # 获取本周人流量
        week_start = (datetime.now() - timedelta(days=datetime.now().weekday())).strftime('%Y-%m-%d')
        week_traffic = db_manager.execute_query("""
            SELECT 
                SUM(CASE WHEN event_type = 'enter' THEN person_count ELSE 0 END) as entered,
                SUM(CASE WHEN event_type = 'leave' THEN person_count ELSE 0 END) as left
            FROM traffic_logs 
            WHERE DATE(timestamp) >= ?
        """, (week_start,))
        
        # 获取本月人流量
        month_start = datetime.now().replace(day=1).strftime('%Y-%m-%d')
        month_traffic = db_manager.execute_query("""
            SELECT 
                SUM(CASE WHEN event_type = 'enter' THEN person_count ELSE 0 END) as entered,
                SUM(CASE WHEN event_type = 'leave' THEN person_count ELSE 0 END) as left
            FROM traffic_logs 
            WHERE DATE(timestamp) >= ?
        """, (month_start,))
        
        # 获取实时人流量
        current_stats = traffic_counter.get_daily_stats()
        
        return jsonify({
            'success': True,
            'stats': {
                'today': {
                    'entered': today_traffic[0]['entered'] if today_traffic and today_traffic[0]['entered'] else 0,
                    'left': today_traffic[0]['left'] if today_traffic and today_traffic[0]['left'] else 0
                },
                'week': {
                    'entered': week_traffic[0]['entered'] if week_traffic and week_traffic[0]['entered'] else 0,
                    'left': week_traffic[0]['left'] if week_traffic and week_traffic[0]['left'] else 0
                },
                'month': {
                    'entered': month_traffic[0]['entered'] if month_traffic and month_traffic[0]['entered'] else 0,
                    'left': month_traffic[0]['left'] if month_traffic and month_traffic[0]['left'] else 0
                },
                'current': current_stats
            }
        })
        
    except Exception as e:
        log_system_event('ERROR', 'admin', f'获取人流量统计失败: {str(e)}')
        return jsonify({
            'success': False,
            'message': '获取人流量统计失败'
        }), 500

@admin_bp.route('/inventory/alert')
@admin_required
def inventory_alerts():
    """获取库存预警"""
    try:
        # 获取缺货商品
        out_of_stock = db_manager.execute_query(
            "SELECT id, name, stock FROM products WHERE stock = 0 AND status = 'active'"
        )
        
        # 获取低库存商品（库存 < 10）
        low_stock = db_manager.execute_query(
            "SELECT id, name, stock FROM products WHERE stock < 10 AND stock > 0 AND status = 'active'"
        )
        
        alerts = []
        
        # 添加缺货警告
        for product in out_of_stock:
            alerts.append({
                'type': 'danger',
                'title': '商品缺货',
                'message': f'商品 "{product["name"]}" 已完全缺货，需要立即补货',
                'product_id': product['id'],
                'stock': product['stock']
            })
        
        # 添加低库存警告
        for product in low_stock:
            alerts.append({
                'type': 'warning',
                'title': '库存偏低',
                'message': f'商品 "{product["name"]}" 库存仅剩 {product["stock"]} 件，建议及时补货',
                'product_id': product['id'],
                'stock': product['stock']
            })
        
        return jsonify({
            'success': True,
            'alerts': alerts
        })
        
    except Exception as e:
        log_system_event('ERROR', 'admin', f'获取库存预警失败: {str(e)}')
        return jsonify({
            'success': False,
            'message': '获取库存预警失败'
        }), 500