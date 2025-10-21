"""
自定义异常类
Custom exceptions for SmartStore
"""


class SmartStoreException(Exception):
    """SmartStore基础异常类"""
    def __init__(self, message: str, code: int = 500):
        self.message = message
        self.code = code
        super().__init__(self.message)


class DatabaseException(SmartStoreException):
    """数据库异常"""
    def __init__(self, message: str):
        super().__init__(f"数据库错误: {message}", code=500)


class ModelException(SmartStoreException):
    """模型异常"""
    def __init__(self, message: str):
        super().__init__(f"模型错误: {message}", code=500)


class CameraException(SmartStoreException):
    """摄像头异常"""
    def __init__(self, message: str):
        super().__init__(f"摄像头错误: {message}", code=500)


class DetectionException(SmartStoreException):
    """检测异常"""
    def __init__(self, message: str):
        super().__init__(f"检测错误: {message}", code=500)


class RecognitionException(SmartStoreException):
    """识别异常"""
    def __init__(self, message: str):
        super().__init__(f"识别错误: {message}", code=500)


class PaymentException(SmartStoreException):
    """支付异常"""
    def __init__(self, message: str):
        super().__init__(f"支付错误: {message}", code=400)


class InsufficientStockException(SmartStoreException):
    """库存不足异常"""
    def __init__(self, commodity_name: str, required: int, available: int):
        message = f"商品 '{commodity_name}' 库存不足: 需要 {required}, 可用 {available}"
        super().__init__(message, code=400)


class UserNotFoundException(SmartStoreException):
    """用户不存在异常"""
    def __init__(self, user_id: int = None):
        message = f"用户不存在: ID={user_id}" if user_id else "用户不存在"
        super().__init__(message, code=404)


class CommodityNotFoundException(SmartStoreException):
    """商品不存在异常"""
    def __init__(self, commodity_id: int = None):
        message = f"商品不存在: ID={commodity_id}" if commodity_id else "商品不存在"
        super().__init__(message, code=404)


class InvalidParameterException(SmartStoreException):
    """参数无效异常"""
    def __init__(self, param_name: str, reason: str = None):
        message = f"参数 '{param_name}' 无效"
        if reason:
            message += f": {reason}"
        super().__init__(message, code=400)


class AuthenticationException(SmartStoreException):
    """认证失败异常"""
    def __init__(self, message: str = "认证失败"):
        super().__init__(message, code=401)


class PermissionException(SmartStoreException):
    """权限不足异常"""
    def __init__(self, message: str = "权限不足"):
        super().__init__(message, code=403)
