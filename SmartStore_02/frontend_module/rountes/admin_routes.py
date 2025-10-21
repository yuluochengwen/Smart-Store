# 管理后台路由（需要修改的部分已标注）
from flask import Blueprint, render_template, request, flash, redirect, url_for
from ..utils.form_validator import validate_registration

admin_bp = Blueprint('admin', __name__)

# 管理员登录验证装饰器
def admin_required(f):
    def wrap(*args, **kwargs):
        # TODO: 安全修改 - 添加管理员认证逻辑
        is_admin = True  # 需要修改：替换为真实管理员认证
        if not is_admin:
            flash('请使用管理员账号登录', 'error')
            return redirect(url_for('admin.login'))
        return f(*args, **kwargs)
    wrap.__name__ = f.__name__
    return wrap

@admin_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('admin-username')
        password = request.form.get('admin-password')
        # TODO: 安全修改 - 添加管理员认证逻辑
        if username == 'admin' and password == 'admin123':  # 需要修改：替换为真实密码
            return redirect(url_for('admin.inventory_manage'))
        else:
            flash('管理员账号或密码错误', 'error')
    return render_template('admin/admin_login.html')

@admin_bp.route('/inventory')
@admin_required
def inventory_manage():
    # TODO: 数据修改 - 添加库存数据获取逻辑
    inventory = [
        {'id': 1, 'name': '华为充电器插头', 'stock': 100, 'threshold': 20},
        {'id': 2, 'name': '知味观锦绣宝盒糕点礼盒', 'stock': 50, 'threshold': 10},
        {'id': 3, 'name': '三只松鼠坚果礼盒', 'stock': 15, 'threshold': 20}
    ]
    return render_template('admin/inventory_manage.html', inventory=inventory)

@admin_bp.route('/orders')
@admin_required
def order_manage():
    # TODO: 数据修改 - 添加订单数据获取逻辑
    orders = [
        {
            'id': '20251016001',
            'time': '2025-10-16 10:30',
            'amount': '184.17',
            'status': '已完成',
            'is_abnormal': False
        },
        {
            'id': '20251016004',
            'time': '2025-10-16 15:10',
            'amount': '78.00',
            'status': '已取消',
            'is_abnormal': True
        }
    ]
    return render_template('admin/order_manage.html', orders=orders)

@admin_bp.route('/order/<order_id>')
@admin_required
def order_detail(order_id):
    # TODO: 数据修改 - 添加订单详情获取逻辑
    order = {
        'id': order_id,
        'time': '2025-10-16 10:30',
        'amount': '184.17',
        'payment': '人脸支付',
        'user': '示例用户 (ID: 1001)',
        'products': [
            {'name': '华为充电器插头', 'quantity': 1, 'price': '184.17', 'subtotal': '184.17'}
        ]
    }
    return render_template('admin/order_manage.html', order=order)