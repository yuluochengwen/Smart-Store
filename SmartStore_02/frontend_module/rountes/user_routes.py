# 用户页面路由（需要修改的部分已标注）
from flask import Blueprint, render_template, request, redirect, url_for, flash
from ..utils.form_validator import validate_registration

user_bp = Blueprint('user', __name__)

@user_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        # TODO: 业务逻辑修改 - 添加实际用户认证逻辑
        if username == 'admin' and password == 'password':  # 需要修改：替换为真实认证
            return redirect(url_for('user.member_center'))
        else:
            flash('用户名或密码错误', 'error')
    return render_template('user/login.html')

@user_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        form_data = {
            'username': request.form.get('username'),
            'password': request.form.get('password'),
            'email': request.form.get('email')
        }
        # 调用表单验证工具
        is_valid, message = validate_registration(form_data)
        if is_valid:
            # TODO: 业务逻辑修改 - 添加用户注册数据库操作
            flash('注册成功，请登录', 'success')
            return redirect(url_for('user.login'))
        else:
            flash(message, 'error')
    return render_template('user/register.html')

@user_bp.route('/member_center')
def member_center():
    # TODO: 业务逻辑修改 - 添加用户信息获取逻辑
    user_info = {
        'username': '示例用户',  # 需要修改：从会话获取真实用户名
        'level': '普通会员',
        'register_date': '2025-01-15'
    }
    # TODO: 业务逻辑修改 - 添加订单数据获取逻辑
    orders = [
        {
            'id': '20251016001',
            'product': '华为充电器插头',
            'status': '已完成'
        }
    ]
    return render_template('user/member_center.html', user=user_info, orders=orders)

@user_bp.route('/payment/<int:order_id>')
def payment(order_id):
    # TODO: 业务逻辑修改 - 添加订单数据获取逻辑
    order = {
        'id': order_id,
        'time': '2025-10-16 10:30',
        'amount': '184.17',
        'product': '华为充电器插头'
    }
    return render_template('user/payment.html', order=order)