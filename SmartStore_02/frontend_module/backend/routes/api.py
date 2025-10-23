"""
API接口路由
提供RESTful API接口，供前端调用
"""

from flask import request, jsonify, send_file
from ..utils.database import db_manager, log_system_event
from ..utils.camera import camera_manager, object_detector, traffic_counter
from ..utils.ai_detection import detect_products_in_image, get_product_recommendations, chat_with_ai
from ..routes import api_bp

@api_bp.route('/health', methods=['GET'])
def health_check():
    """健康检查"""
    try:
        # 检查数据库连接
        db_manager.execute_query("SELECT 1")
        
        # 检查摄像头状态
        camera_status = camera_manager.is_running
        
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'camera': 'running' if camera_status else 'stopped',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

@api_bp.route('/system/info', methods=['GET'])
def system_info():
    """获取系统信息"""
    try:
        info = {
            'version': '1.0.0',
            'name': '智能购物系统',
            'description': '基于AI视觉识别的智能购物系统',
            'features': [
                '商品自动识别',
                '智能购物车',
                'AI购物助手',
                '人流量监控',
                '库存管理',
                '数据分析'
            ],
            'supported_formats': ['jpg', 'jpeg', 'png', 'webp'],
            'max_file_size': '16MB',
            'api_version': 'v1'
        }
        
        return jsonify({
            'success': True,
            'info': info
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': '获取系统信息失败'
        }), 500

@api_bp.route('/camera/stream', methods=['GET'])
def camera_stream():
    """获取摄像头流"""
    try:
        # 这里应该实现真实的视频流
        # 现在返回一个模拟的响应
        return jsonify({
            'success': True,
            'stream_url': '/static/video/stream.m3u8',
            'format': 'hls',
            'quality': '720p'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': '获取视频流失败'
        }), 500

@api_bp.route('/detection/realtime', methods=['GET'])
def realtime_detection():
    """实时检测接口"""
    try:
        # 获取当前检测结果
        frame = camera_manager.get_frame()
        
        if frame is not None:
            # 执行商品检测
            detections = detect_products_in_image(frame)
            
            return jsonify({
                'success': True,
                'detections': detections,
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'success': False,
                'message': '无法获取摄像头画面'
            }), 503
            
    except Exception as e:
        log_system_event('ERROR', 'api', f'实时检测失败: {str(e)}')
        return jsonify({
            'success': False,
            'message': '实时检测失败'
        }), 500

@api_bp.route('/detection/history', methods=['GET'])
def detection_history():
    """获取检测历史"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        date_filter = request.args.get('date', '')
        
        # 构建查询条件
        where_conditions = []
        params = []
        
        if date_filter:
            where_conditions.append("DATE(created_at) = ?")
            params.append(date_filter)
        
        where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
        
        # 获取总数
        count_query = f"SELECT COUNT(*) as total FROM detection_logs WHERE {where_clause}"
        total_result = db_manager.execute_query(count_query, params)
        total = total_result[0]['total'] if total_result else 0
        
        # 获取分页数据
        offset = (page - 1) * per_page
        query = f"""
            SELECT id, product_id, product_name, confidence, status, created_at
            FROM detection_logs 
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        """
        params.extend([per_page, offset])
        
        history = db_manager.execute_query(query, params)
        
        return jsonify({
            'success': True,
            'history': history,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        log_system_event('ERROR', 'api', f'获取检测历史失败: {str(e)}')
        return jsonify({
            'success': False,
            'message': '获取检测历史失败'
        }), 500

@api_bp.route('/analytics/sales', methods=['GET'])
def sales_analytics():
    """销售分析"""
    try:
        period = request.args.get('period', '7d')  # 7d, 30d, 90d
        
        # 根据时间段构建查询
        days = {'7d': 7, '30d': 30, '90d': 90}.get(period, 7)
        
        # 获取销售趋势
        sales_trend = db_manager.execute_query("""
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as orders,
                SUM(amount) as revenue
            FROM orders 
            WHERE created_at >= datetime('now', '-{} days')
                AND status = 'paid'
            GROUP BY DATE(created_at)
            ORDER BY date
        """.format(days))
        
        # 获取热销商品
        hot_products = db_manager.execute_query("""
            SELECT 
                p.name,
                p.category,
                SUM(oi.quantity) as total_sold,
                SUM(oi.subtotal) as total_revenue
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.created_at >= datetime('now', '-{} days')
                AND o.status = 'paid'
            GROUP BY oi.product_id, p.name, p.category
            ORDER BY total_sold DESC
            LIMIT 10
        """.format(days))
        
        # 获取支付方式分布
        payment_methods = db_manager.execute_query("""
            SELECT 
                payment_method,
                COUNT(*) as count,
                SUM(amount) as total_amount
            FROM orders 
            WHERE created_at >= datetime('now', '-{} days')
                AND status = 'paid'
            GROUP BY payment_method
            ORDER BY count DESC
        """.format(days))
        
        return jsonify({
            'success': True,
            'analytics': {
                'period': period,
                'sales_trend': sales_trend,
                'hot_products': hot_products,
                'payment_methods': payment_methods
            }
        })
        
    except Exception as e:
        log_system_event('ERROR', 'api', f'获取销售分析失败: {str(e)}')
        return jsonify({
            'success': False,
            'message': '获取销售分析失败'
        }), 500

@api_bp.route('/analytics/traffic', methods=['GET'])
def traffic_analytics():
    """人流量分析"""
    try:
        period = request.args.get('period', '7d')  # 7d, 30d, 90d
        
        # 根据时间段构建查询
        days = {'7d': 7, '30d': 30, '90d': 90}.get(period, 7)
        
        # 获取人流量趋势
        traffic_trend = db_manager.execute_query("""
            SELECT 
                DATE(timestamp) as date,
                SUM(CASE WHEN event_type = 'enter' THEN person_count ELSE 0 END) as entered,
                SUM(CASE WHEN event_type = 'leave' THEN person_count ELSE 0 END) as left
            FROM traffic_logs 
            WHERE timestamp >= datetime('now', '-{} days')
            GROUP BY DATE(timestamp)
            ORDER BY date
        """.format(days))
        
        # 获取高峰时段
        peak_hours = db_manager.execute_query("""
            SELECT 
                strftime('%H', timestamp) as hour,
                SUM(CASE WHEN event_type = 'enter' THEN person_count ELSE 0 END) as entered,
                SUM(CASE WHEN event_type = 'leave' THEN person_count ELSE 0 END) as left
            FROM traffic_logs 
            WHERE timestamp >= datetime('now', '-{} days')
            GROUP BY strftime('%H', timestamp)
            ORDER BY entered DESC
            LIMIT 5
        """.format(days))
        
        return jsonify({
            'success': True,
            'analytics': {
                'period': period,
                'traffic_trend': traffic_trend,
                'peak_hours': peak_hours
            }
        })
        
    except Exception as e:
        log_system_event('ERROR', 'api', f'获取人流量分析失败: {str(e)}')
        return jsonify({
            'success': False,
            'message': '获取人流量分析失败'
        }), 500

@api_bp.route('/export/orders', methods=['GET'])
def export_orders():
    """导出订单数据"""
    try:
        format_type = request.args.get('format', 'csv')  # csv, json, excel
        start_date = request.args.get('start_date', '')
        end_date = request.args.get('end_date', '')
        
        # 构建查询条件
        where_conditions = []
        params = []
        
        if start_date:
            where_conditions.append("created_at >= ?")
            params.append(start_date)
        
        if end_date:
            where_conditions.append("created_at <= ?")
            params.append(end_date)
        
        where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
        
        # 获取订单数据
        orders = db_manager.execute_query(f"""
            SELECT 
                o.id, o.customer_name, o.customer_phone, o.customer_address,
                o.amount, o.status, o.payment_method, o.payment_time,
                o.created_at, oi.product_name, oi.quantity, oi.price, oi.subtotal
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE {where_clause}
            ORDER BY o.created_at DESC
        """, params)
        
        # 根据格式生成文件
        if format_type == 'csv':
            # 生成CSV文件
            import csv
            import io
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            # 写入表头
            writer.writerow([
                '订单号', '客户姓名', '客户电话', '客户地址',
                '订单金额', '订单状态', '支付方式', '支付时间',
                '下单时间', '商品名称', '数量', '单价', '小计'
            ])
            
            # 写入数据
            for order in orders:
                writer.writerow([
                    order['id'], order['customer_name'], order['customer_phone'], order['customer_address'],
                    order['amount'], order['status'], order['payment_method'], order['payment_time'],
                    order['created_at'], order['product_name'], order['quantity'], order['price'], order['subtotal']
                ])
            
            # 返回CSV文件
            output.seek(0)
            return send_file(
                io.BytesIO(output.getvalue().encode('utf-8')),
                mimetype='text/csv',
                as_attachment=True,
                download_name=f'orders_{datetime.now().strftime("%Y%m%d")}.csv'
            )
        
        elif format_type == 'json':
            # 返回JSON数据
            return jsonify({
                'success': True,
                'orders': orders,
                'exported_at': datetime.now().isoformat()
            })
        
        else:
            return jsonify({
                'success': False,
                'message': '不支持的导出格式'
            }), 400
        
    except Exception as e:
        log_system_event('ERROR', 'api', f'导出订单失败: {str(e)}')
        return jsonify({
            'success': False,
            'message': '导出订单失败'
        }), 500

@api_bp.route('/backup/database', methods=['POST'])
def backup_database():
    """备份数据库"""
    try:
        from ..utils.database import backup_database
        
        backup_file = backup_database()
        
        return jsonify({
            'success': True,
            'message': '数据库备份成功',
            'backup_file': backup_file
        })
        
    except Exception as e:
        log_system_event('ERROR', 'api', f'数据库备份失败: {str(e)}')
        return jsonify({
            'success': False,
            'message': '数据库备份失败'
        }), 500

@api_bp.route('/logs', methods=['GET'])
def get_logs():
    """获取系统日志"""
    try:
        level = request.args.get('level', '')
        module = request.args.get('module', '')
        limit = int(request.args.get('limit', 100))
        
        # 构建查询条件
        where_conditions = []
        params = []
        
        if level:
            where_conditions.append("level = ?")
            params.append(level)
        
        if module:
            where_conditions.append("module = ?")
            params.append(module)
        
        where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
        
        # 获取日志
        query = f"""
            SELECT id, level, module, message, details, created_at
            FROM system_logs 
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT ?
        """
        params.append(limit)
        
        logs = db_manager.execute_query(query, params)
        
        return jsonify({
            'success': True,
            'logs': logs
        })
        
    except Exception as e:
        log_system_event('ERROR', 'api', f'获取系统日志失败: {str(e)}')
        return jsonify({
            'success': False,
            'message': '获取系统日志失败'
        }), 500

# 导入必要的模块
from datetime import datetime