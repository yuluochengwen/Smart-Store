def validate_registration(form_data):
    """验证注册表单数据"""
    if not form_data.get('username'):
        return False, "用户名不能为空"
    if not form_data.get('password') or len(form_data.get('password')) < 6:
        return False, "密码至少6位"
    return True, "验证通过"