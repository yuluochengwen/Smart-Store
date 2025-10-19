"""
SmartStore主应用入口
Main application entry point for SmartStore
"""
import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from common.config.app_config import AppConfig
from common.utils.logger import get_logger
from common.exceptions.error_handler import register_error_handlers, success_response, error_response
from data_layer.database.db_connector import db_connector
from app_entry.startup_config import init_app

logger = get_logger(__name__)

# 创建Flask应用
app = Flask(__name__, 
            template_folder='../frontend/templates',
            static_folder='../frontend/static')

# 配置
app.config['SECRET_KEY'] = AppConfig.SECRET_KEY
app.config['DEBUG'] = AppConfig.DEBUG

# 启用CORS
CORS(app, origins=AppConfig.CORS_ORIGINS)

# 注册错误处理器
register_error_handlers(app)


# ============== 路由定义 ==============

@app.route('/')
def index():
    """主页"""
    return render_template('index.html')


@app.route('/admin')
def admin():
    """管理后台"""
    return render_template('admin.html')


@app.route('/test/face')
def test_face():
    """人脸识别测试页面"""
    return render_template('test_face.html')


@app.route('/debug')
def debug():
    """调试页面"""
    return render_template('debug.html')


# ============== API路由 ==============

@app.route('/api/v1/health', methods=['GET'])
def health_check():
    """健康检查"""
    return success_response({'status': 'healthy'}, '系统运行正常')


@app.route('/api/v1/customer/detect', methods=['POST'])
def customer_detect():
    """顾客检测和识别API"""
    try:
        data = request.get_json()
        image_base64 = data.get('image')
        
        if not image_base64:
            return error_response('未提供图像数据', 400)
        
        # 将 base64 转换为图像
        import base64
        import numpy as np
        import cv2
        from io import BytesIO
        from PIL import Image
        
        image_data = base64.b64decode(image_base64)
        image = Image.open(BytesIO(image_data))
        image_np = np.array(image)
        
        # 转换 RGB 为 BGR (OpenCV 格式)
        if len(image_np.shape) == 3 and image_np.shape[2] == 3:
            image_np = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
        
        # 使用 DeepFace 检测和识别人脸
        from deepface import DeepFace
        
        try:
            # 检测人脸
            faces = DeepFace.extract_faces(
                img_path=image_np,
                detector_backend='opencv',
                enforce_detection=False
            )
            
            face_count = len([f for f in faces if f.get('confidence', 0) > 0.9])
            
            if face_count == 0:
                return success_response({
                    'face_count': 0,
                    'recognized': False
                }, '未检测到人脸')
            
            # 尝试识别第一个检测到的人脸
            main_face = faces[0]
            if main_face.get('confidence', 0) > 0.9:
                # 提取人脸特征
                face_embedding = DeepFace.represent(
                    img_path=image_np,
                    model_name='Facenet',
                    enforce_detection=False
                )[0]['embedding']
                
                # 在数据库中查找匹配的用户
                from data_layer.database.db_connector import get_db_connector
                from data_layer.database.models import User
                import json
                
                db_conn = get_db_connector()
                with db_conn.session_scope() as session:
                    users = session.query(User).filter(User.face_encoding.isnot(None)).all()
                    logger.info(f"从数据库加载了 {len(users)} 个有人脸数据的用户")
                    
                    # 计算与所有用户的相似度
                    best_match = None
                    best_distance = float('inf')
                    threshold = 10.0  # Facenet 欧氏距离阈值，通常同一人在 0.6-10 之间
                    
                    for user in users:
                        try:
                            stored_embedding = json.loads(user.face_encoding)
                            # 计算欧氏距离
                            distance = np.linalg.norm(
                                np.array(face_embedding) - np.array(stored_embedding)
                            )
                            
                            logger.info(f"与用户 {user.name} (ID:{user.id}) 的距离: {distance:.4f} (阈值: {threshold})")
                            
                            if distance < best_distance:
                                best_distance = distance
                                if distance < threshold:
                                    best_match = user
                        except Exception as e:
                            logger.error(f"比对用户 {user.name} 时出错: {str(e)}")
                            continue
                    
                    if best_match:
                        # 识别成功
                        logger.info(f"✅ 识别成功! 用户: {best_match.name}, 距离: {best_distance:.4f}")
                        return success_response({
                            'face_count': face_count,
                            'recognized': True,
                            'user': best_match.to_dict(),
                            'distance': best_distance
                        }, f'欢迎回来，{best_match.name}！')
                    else:
                        # 检测到人脸但未识别
                        logger.info(f"❌ 未识别到匹配用户，最小距离: {best_distance:.4f} (超过阈值 {threshold})")
                        return success_response({
                            'face_count': face_count,
                            'recognized': False,
                            'faces': [{
                                'encoding': face_embedding,
                                'confidence': main_face.get('confidence', 0)
                            }]
                        }, '检测到新顾客')
            else:
                return success_response({
                    'face_count': face_count,
                    'recognized': False
                }, '人脸检测置信度较低')
                
        except Exception as e:
            logger.error(f"人脸检测异常: {str(e)}")
            return success_response({
                'face_count': 0,
                'recognized': False
            }, '人脸检测失败')
        
    except Exception as e:
        logger.error(f"顾客检测失败: {str(e)}")
        return error_response(str(e))


@app.route('/api/v1/customer/register', methods=['POST'])
def customer_register():
    """注册新顾客API"""
    try:
        data = request.get_json()
        logger.info(f"收到注册请求: {data.keys() if data else 'None'}")
        
        name = data.get('name')
        phone = data.get('phone')
        email = data.get('email')
        face_encoding = data.get('face_encoding')
        
        logger.info(f"注册参数: name={name}, phone={phone}, email={email}, face_encoding类型={type(face_encoding)}")
        
        if not name:
            logger.warning("注册失败: 姓名为空")
            return error_response('姓名不能为空', 400)
        
        if not face_encoding:
            logger.warning("注册失败: 人脸特征为空")
            return error_response('人脸特征不能为空', 400)
        
        # 保存到数据库
        from data_layer.database.db_connector import get_db_connector
        from data_layer.database.models import User, UserRole
        import json
        
        db_conn = get_db_connector()
        with db_conn.session_scope() as session:
            # 检查手机号或邮箱是否已存在
            if phone:
                existing = session.query(User).filter(User.phone == phone).first()
                if existing:
                    logger.warning(f"注册失败: 手机号 {phone} 已存在")
                    return error_response('该手机号已注册', 400)
            
            if email:
                existing = session.query(User).filter(User.email == email).first()
                if existing:
                    logger.warning(f"注册失败: 邮箱 {email} 已存在")
                    return error_response('该邮箱已注册', 400)
            
            # 创建新用户
            new_user = User(
                name=name,
                phone=phone,
                email=email,
                role=UserRole.MEMBER,
                face_encoding=json.dumps(face_encoding),
                balance=0.0
            )
            
            session.add(new_user)
            session.flush()  # 获取 ID
            
            logger.info(f"新用户注册成功: {name} (ID: {new_user.id})")
            
            return success_response({
                'user': new_user.to_dict()
            }, '注册成功！欢迎来到 SmartStore！')
        
    except Exception as e:
        logger.error(f"顾客注册失败: {str(e)}")
        return error_response(str(e))


@app.route('/api/v1/commodity/recognize', methods=['POST'])
def commodity_recognize():
    """商品识别API"""
    try:
        # 这里可以接收图像并进行识别
        return success_response({'commodities': []}, '识别完成')
    except Exception as e:
        logger.error(f"商品识别失败: {str(e)}")
        return error_response(str(e))


@app.route('/api/v1/voice/ask', methods=['POST'])
def voice_ask():
    """语音问答API"""
    try:
        data = request.get_json()
        question = data.get('question', '')
        
        if not question:
            return error_response('问题不能为空', 400)
        
        # 这里调用问答模块
        from core_modules.voice_interaction.llm_integration.question_answering import QuestionAnswering
        qa = QuestionAnswering()
        answer = qa.answer(question)
        
        return success_response({'answer': answer}, '回答成功')
    except Exception as e:
        logger.error(f"语音问答失败: {str(e)}")
        return error_response(str(e))


@app.route('/api/v1/basket/<int:user_id>', methods=['GET'])
def get_basket(user_id):
    """获取购物篮"""
    try:
        from core_modules.commodity_detection.basket_management.basket_updater import BasketUpdater
        basket_updater = BasketUpdater()
        basket_details = basket_updater.get_basket_details(user_id)
        total = basket_updater.calculate_total(user_id)
        
        return success_response({
            'items': basket_details,
            'total': total
        }, '获取购物篮成功')
    except Exception as e:
        logger.error(f"获取购物篮失败: {str(e)}")
        return error_response(str(e))


@app.route('/api/v1/payment/face', methods=['POST'])
def face_payment():
    """人脸支付API"""
    try:
        data = request.get_json()
        amount = data.get('amount', 0)
        
        # 这里需要接收人脸图像
        # 示例返回
        return success_response({'success': True}, '支付成功')
    except Exception as e:
        logger.error(f"人脸支付失败: {str(e)}")
        return error_response(str(e))


@app.route('/api/v1/commodities', methods=['GET'])
def get_commodities():
    """获取商品列表"""
    try:
        from data_layer.database.models import Commodity
        search = request.args.get('search', '')
        
        with db_connector.session_scope() as session:
            query = session.query(Commodity)
            if search:
                query = query.filter(Commodity.name.like(f'%{search}%'))
            commodities = query.all()
            result = [c.to_dict() for c in commodities]
            
        return success_response(result, '获取成功')
    except Exception as e:
        logger.error(f"获取商品列表失败: {str(e)}")
        return error_response(str(e))


# ========== 管理后台 API ==========

@app.route('/api/v1/admin/stats', methods=['GET'])
def admin_stats():
    """获取统计数据"""
    try:
        from data_layer.database.models import User, Commodity, Transaction
        from sqlalchemy import func
        from datetime import date
        
        with db_connector.session_scope() as session:
            # 今日销售额
            today_sales = session.query(func.sum(Transaction.total_amount)).filter(
                func.date(Transaction.created_at) == date.today()
            ).scalar() or 0
            
            # 今日订单数
            today_orders = session.query(func.count(Transaction.id)).filter(
                func.date(Transaction.created_at) == date.today()
            ).scalar() or 0
            
            # 总用户数
            total_users = session.query(func.count(User.id)).scalar() or 0
            
            # 总商品数
            total_commodities = session.query(func.count(Commodity.id)).scalar() or 0
            
            return success_response({
                'today_sales': float(today_sales),
                'today_orders': today_orders,
                'total_users': total_users,
                'total_commodities': total_commodities
            }, '获取成功')
    except Exception as e:
        logger.error(f"获取统计数据失败: {str(e)}")
        return error_response(str(e))


@app.route('/api/v1/admin/recent-transactions', methods=['GET'])
def admin_recent_transactions():
    """获取最近交易"""
    try:
        from data_layer.database.models import Transaction, User
        
        with db_connector.session_scope() as session:
            transactions = session.query(Transaction).join(User).order_by(
                Transaction.created_at.desc()
            ).limit(5).all()
            
            result = [{
                'id': t.id,
                'user_name': t.user.name,
                'amount': float(t.total_amount),
                'created_at': t.created_at.strftime('%Y-%m-%d %H:%M:%S')
            } for t in transactions]
            
            return success_response(result, '获取成功')
    except Exception as e:
        logger.error(f"获取最近交易失败: {str(e)}")
        return error_response(str(e))


@app.route('/api/v1/admin/users', methods=['GET'])
def admin_users():
    """获取用户列表"""
    try:
        from data_layer.database.models import User
        search = request.args.get('search', '')
        role = request.args.get('role', '')
        
        with db_connector.session_scope() as session:
            query = session.query(User)
            
            if search:
                query = query.filter(
                    (User.name.like(f'%{search}%')) | 
                    (User.phone.like(f'%{search}%'))
                )
            
            if role:
                query = query.filter(User.role == role)
            
            users = query.all()
            result = [u.to_dict() for u in users]
            
            return success_response(result, '获取成功')
    except Exception as e:
        logger.error(f"获取用户列表失败: {str(e)}")
        return error_response(str(e))


@app.route('/api/v1/admin/transactions', methods=['GET'])
def admin_transactions():
    """获取交易记录"""
    try:
        from data_layer.database.models import Transaction, User
        from datetime import datetime
        
        start_date = request.args.get('start_date', '')
        end_date = request.args.get('end_date', '')
        
        with db_connector.session_scope() as session:
            query = session.query(Transaction).join(User)
            
            if start_date:
                start = datetime.strptime(start_date, '%Y-%m-%d')
                query = query.filter(Transaction.created_at >= start)
            
            if end_date:
                end = datetime.strptime(end_date, '%Y-%m-%d')
                query = query.filter(Transaction.created_at <= end)
            
            transactions = query.order_by(Transaction.created_at.desc()).all()
            
            result = [{
                'id': t.id,
                'user_name': t.user.name,
                'amount': float(t.total_amount),
                'payment_method': t.payment_method.value if hasattr(t.payment_method, 'value') else str(t.payment_method),
                'status': t.status.value if hasattr(t.status, 'value') else str(t.status),
                'created_at': t.created_at.strftime('%Y-%m-%d %H:%M:%S')
            } for t in transactions]
            
            return success_response(result, '获取成功')
    except Exception as e:
        logger.error(f"获取交易记录失败: {str(e)}")
        return error_response(str(e))


@app.route('/api/v1/admin/inventory', methods=['GET'])
def admin_inventory():
    """获取库存信息"""
    try:
        from data_layer.database.models import Commodity
        
        with db_connector.session_scope() as session:
            commodities = session.query(Commodity).all()
            
            total_value = sum(c.price * c.stock for c in commodities)
            low_stock_count = sum(1 for c in commodities if c.stock < 10 and c.stock > 0)
            out_stock_count = sum(1 for c in commodities if c.stock == 0)
            
            items = [{
                'id': c.id,
                'name': c.name,
                'stock': c.stock,
                'safe_stock': 10,
                'price': float(c.price)
            } for c in commodities]
            
            return success_response({
                'total_value': float(total_value),
                'low_stock_count': low_stock_count,
                'out_stock_count': out_stock_count,
                'items': items
            }, '获取成功')
    except Exception as e:
        logger.error(f"获取库存信息失败: {str(e)}")
        return error_response(str(e))


@app.route('/api/v1/admin/commodities', methods=['POST'])
def admin_add_commodity():
    """添加商品"""
    try:
        from data_layer.database.models import Commodity
        data = request.get_json()
        
        with db_connector.session_scope() as session:
            commodity = Commodity(
                name=data['name'],
                category=data.get('category'),
                price=data['price'],
                stock=data['stock'],
                location=data.get('location')
            )
            session.add(commodity)
            session.flush()
            
            logger.info(f"添加商品成功: {commodity.name} (ID: {commodity.id})")
            return success_response(commodity.to_dict(), '添加成功')
    except Exception as e:
        logger.error(f"添加商品失败: {str(e)}")
        return error_response(str(e))


@app.route('/api/v1/admin/commodities/<int:commodity_id>', methods=['GET'])
def admin_get_commodity(commodity_id):
    """获取商品详情"""
    try:
        from data_layer.database.models import Commodity
        
        with db_connector.session_scope() as session:
            commodity = session.query(Commodity).filter(Commodity.id == commodity_id).first()
            if not commodity:
                return error_response('商品不存在', 404)
            
            return success_response(commodity.to_dict(), '获取成功')
    except Exception as e:
        logger.error(f"获取商品详情失败: {str(e)}")
        return error_response(str(e))


@app.route('/api/v1/admin/commodities/<int:commodity_id>', methods=['PUT'])
def admin_update_commodity(commodity_id):
    """更新商品"""
    try:
        from data_layer.database.models import Commodity
        data = request.get_json()
        
        with db_connector.session_scope() as session:
            commodity = session.query(Commodity).filter(Commodity.id == commodity_id).first()
            if not commodity:
                return error_response('商品不存在', 404)
            
            commodity.name = data.get('name', commodity.name)
            commodity.category = data.get('category', commodity.category)
            commodity.price = data.get('price', commodity.price)
            commodity.stock = data.get('stock', commodity.stock)
            commodity.location = data.get('location', commodity.location)
            
            logger.info(f"更新商品成功: {commodity.name} (ID: {commodity.id})")
            return success_response(commodity.to_dict(), '更新成功')
    except Exception as e:
        logger.error(f"更新商品失败: {str(e)}")
        return error_response(str(e))


@app.route('/api/v1/admin/commodities/<int:commodity_id>', methods=['DELETE'])
def admin_delete_commodity(commodity_id):
    """删除商品"""
    try:
        from data_layer.database.models import Commodity
        
        with db_connector.session_scope() as session:
            commodity = session.query(Commodity).filter(Commodity.id == commodity_id).first()
            if not commodity:
                return error_response('商品不存在', 404)
            
            name = commodity.name
            session.delete(commodity)
            
            logger.info(f"删除商品成功: {name} (ID: {commodity_id})")
            return success_response({}, '删除成功')
    except Exception as e:
        logger.error(f"删除商品失败: {str(e)}")
        return error_response(str(e))


@app.route('/api/v1/recommend', methods=['POST'])
def recommend():
    """商品推荐API"""
    try:
        data = request.get_json()
        query = data.get('query', '')
        
        from core_modules.voice_interaction.llm_integration.commodity_recommender import CommodityRecommender
        recommender = CommodityRecommender()
        recommendations = recommender.recommend_by_query(query)
        
        return success_response({'recommendations': recommendations}, '推荐成功')
    except Exception as e:
        logger.error(f"商品推荐失败: {str(e)}")
        return error_response(str(e))


def main():
    """主函数"""
    # 初始化应用
    init_app()
    
    # 运行Flask应用
    logger.info(f"SmartStore启动中... http://{AppConfig.HOST}:{AppConfig.PORT}")
    app.run(
        host=AppConfig.HOST,
        port=AppConfig.PORT,
        debug=AppConfig.DEBUG
    )


if __name__ == '__main__':
    main()
