"""
路由模块初始化文件
"""

from flask import Blueprint

# 创建蓝图
auth_bp = Blueprint('auth', __name__)
client_bp = Blueprint('client', __name__)
admin_bp = Blueprint('admin', __name__)
api_bp = Blueprint('api', __name__)

# 导入路由模块
from . import auth
from . import client
from . import admin
from . import api