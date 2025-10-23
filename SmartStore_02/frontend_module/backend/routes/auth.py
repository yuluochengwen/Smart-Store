"""
认证相关路由
处理用户登录、注册、权限验证等
"""

from flask import request, jsonify, session, render_template, redirect, url_for
from functools import wraps
from ..utils.database import db_manager, log_system_event
from ..routes import auth_bp

def login_required(f):
    """登录验证装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': '请先登录'}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """管理员权限验证装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': '请先登录'}), 401
        
        if session.get('role') != '管理员':
            return jsonify({'success': False, 'message': '需要管理员权限'}), 403
        
        return f(*args, **kwargs)
    return decorated_function

@auth_bp.route('/login', methods=['POST'])
def login():
    """用户登录"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        remember = data.get('remember', False)
        
        if not username or not password:
            return jsonify({
                'success': False,
                'message': '请输入用户名和密码'
            }), 400
        
        # 查询用户
        query = "SELECT * FROM users WHERE username = ? AND password = ?"
        users = db_manager.execute_query(query, (username, password))
        
        if not users:
            log_system_event('WARNING', 'auth', f'登录失败: 用户名或密码错误 - {username}')
            return jsonify({
                'success': False,
                'message': '用户名或密码错误'
            }), 401
        
        user = users[0]
        
        # 检查用户状态
        if user['status'] != 'active':
            log_system_event('WARNING', 'auth', f'登录失败: 用户被禁用 - {username}')
            return jsonify({
                'success': False,
                'message': '用户账户已被禁用'
            }), 403
        
        # 设置session
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['email'] = user['email']
        session['role'] = user['role']
        session['avatar'] = user['avatar']
        
        # 记住登录状态
        if remember:
            session.permanent = True
        
        # 更新最后登录时间
        db_manager.update_data(
            'users',
            {'last_login': datetime.now().isoformat()},
            'id = ?',
            (user['id'],)
        )
        
        log_system_event('INFO', 'auth', f'用户登录成功 - {username}')
        
        return jsonify({
            'success': True,
            'message': '登录成功',
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'role': user['role'],
                'avatar': user['avatar']
            }
        })
        
    except Exception as e:
        log_system_event('ERROR', 'auth', f'登录异常: {str(e)}')
        return jsonify({
            'success': False,
            'message': '登录失败，请稍后重试'
        }), 500

@auth_bp.route('/register', methods=['POST'])
def register():
    """用户注册"""
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        confirm_password = data.get('confirmPassword')
        role = data.get('role', '普通用户')
        phone = data.get('phone', '')
        remark = data.get('remark', '')
        
        # 验证输入
        if not username or not email or not password:
            return jsonify({
                'success': False,
                'message': '请填写完整信息'
            }), 400
        
        if password != confirm_password:
            return jsonify({
                'success': False,
                'message': '两次输入的密码不一致'
            }), 400
        
        # 检查用户名是否已存在
        existing_user = db_manager.execute_query(
            "SELECT id FROM users WHERE username = ?",
            (username,)
        )
        
        if existing_user:
            return jsonify({
                'success': False,
                'message': '用户名已存在'
            }), 400
        
        # 检查邮箱是否已存在
        existing_email = db_manager.execute_query(
            "SELECT id FROM users WHERE email = ?",
            (email,)
        )
        
        if existing_email:
            return jsonify({
                'success': False,
                'message': '邮箱已存在'
            }), 400
        
        # 创建新用户
        user_data = {
            'username': username,
            'email': email,
            'password': password,
            'role': role,
            'avatar': username[0].upper() if username else 'U',
            'phone': phone,
            'remark': remark,
            'created_at': datetime.now().isoformat(),
            'last_login': datetime.now().isoformat()
        }
        
        user_id = db_manager.insert_data('users', user_data)
        
        log_system_event('INFO', 'auth', f'新用户注册成功 - {username}')
        
        return jsonify({
            'success': True,
            'message': '注册成功',
            'user': {
                'id': user_id,
                'username': username,
                'email': email,
                'role': role
            }
        })
        
    except Exception as e:
        log_system_event('ERROR', 'auth', f'注册异常: {str(e)}')
        return jsonify({
            'success': False,
            'message': '注册失败，请稍后重试'
        }), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """用户登出"""
    try:
        username = session.get('username', '未知用户')
        
        # 清除session
        session.clear()
        
        log_system_event('INFO', 'auth', f'用户登出 - {username}')
        
        return jsonify({
            'success': True,
            'message': '登出成功'
        })
        
    except Exception as e:
        log_system_event('ERROR', 'auth', f'登出异常: {str(e)}')
        return jsonify({
            'success': False,
            'message': '登出失败'
        }), 500

@auth_bp.route('/password/reset', methods=['POST'])
def reset_password():
    """重置密码"""
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({
                'success': False,
                'message': '请输入邮箱地址'
            }), 400
        
        # 检查邮箱是否存在
        user = db_manager.execute_query(
            "SELECT id, username FROM users WHERE email = ?",
            (email,)
        )
        
        if not user:
            return jsonify({
                'success': False,
                'message': '该邮箱未注册'
            }), 404
        
        # 这里应该发送重置邮件
        # 现在只是模拟
        log_system_event('INFO', 'auth', f'密码重置请求 - {email}')
        
        return jsonify({
            'success': True,
            'message': '重置邮件已发送，请查收'
        })
        
    except Exception as e:
        log_system_event('ERROR', 'auth', f'密码重置异常: {str(e)}')
        return jsonify({
            'success': False,
            'message': '密码重置失败，请稍后重试'
        }), 500

@auth_bp.route('/profile', methods=['GET'])
@login_required
def get_profile():
    """获取用户资料"""
    try:
        user_id = session['user_id']
        
        user = db_manager.execute_query(
            "SELECT id, username, email, role, avatar, phone, remark, created_at FROM users WHERE id = ?",
            (user_id,)
        )
        
        if not user:
            return jsonify({
                'success': False,
                'message': '用户不存在'
            }), 404
        
        return jsonify({
            'success': True,
            'user': user[0]
        })
        
    except Exception as e:
        logger.error(f"获取用户资料异常: {e}")
        return jsonify({
            'success': False,
            'message': '获取用户资料失败'
        }), 500

@auth_bp.route('/profile', methods=['PUT'])
@login_required
def update_profile():
    """更新用户资料"""
    try:
        user_id = session['user_id']
        data = request.get_json()
        
        # 构建更新数据
        update_data = {}
        if 'phone' in data:
            update_data['phone'] = data['phone']
        if 'remark' in data:
            update_data['remark'] = data['remark']
        if 'avatar' in data:
            update_data['avatar'] = data['avatar']
        
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
            log_system_event('INFO', 'auth', f'用户资料更新成功 - {session["username"]}')
            return jsonify({
                'success': True,
                'message': '资料更新成功'
            })
        else:
            return jsonify({
                'success': False,
                'message': '资料更新失败'
            }), 500
            
    except Exception as e:
        logger.error(f"更新用户资料异常: {e}")
        return jsonify({
            'success': False,
            'message': '资料更新失败'
        }), 500

@auth_bp.route('/check', methods=['GET'])
def check_auth():
    """检查登录状态"""
    if 'user_id' in session:
        return jsonify({
            'success': True,
            'logged_in': True,
            'user': {
                'id': session['user_id'],
                'username': session['username'],
                'email': session['email'],
                'role': session['role'],
                'avatar': session['avatar']
            }
        })
    else:
        return jsonify({
            'success': True,
            'logged_in': False
        })

# 导入必要的模块
from datetime import datetime