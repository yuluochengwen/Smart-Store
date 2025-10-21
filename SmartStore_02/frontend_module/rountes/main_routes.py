# 主页面路由（需要修改的部分已标注）
from flask import Blueprint, render_template

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
@main_bp.route('/index')
def index():
    # TODO: 数据修改 - 实际应用需从数据库获取商品数据
    commodities = [
        {
            'id': 1,
            'name': '华为充电器插头',
            'price': 184.17,
            'sales': '1万+',
            'image': 'commodities/charger.jpg'  # 需要修改：确保图片路径正确
        },
        {
            'id': 2,
            'name': '知味观锦绣宝盒糕点礼盒',
            'price': 499,
            'sales': '10万+',
            'image': 'commodities/cake.jpg'  # 需要修改：确保图片路径正确
        }
        # TODO: 数据修改 - 添加更多商品数据
    ]
    return render_template('main/index.html', commodities=commodities)

@main_bp.route('/commodity/<int:commodity_id>')
def commodity_detail(commodity_id):
    # TODO: 数据修改 - 实际应用需从数据库获取商品详情
    commodity = {
        'id': commodity_id,
        'name': '华为充电器插头',
        'price': 184.17,
        'description': '华为官方正品充电器，支持快速充电技术',
        'image': 'commodities/charger.jpg'  # 需要修改：确保图片路径正确
    }
    return render_template('main/commodity_detail.html', commodity=commodity)