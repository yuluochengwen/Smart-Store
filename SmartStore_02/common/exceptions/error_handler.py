"""
异常处理器
Error handler for SmartStore
"""
from flask import jsonify
from common.exceptions.custom_exceptions import SmartStoreException
from common.utils.logger import get_logger

logger = get_logger(__name__)


def register_error_handlers(app):
    """
    注册Flask应用的错误处理器
    
    Args:
        app: Flask应用实例
    """
    
    @app.errorhandler(SmartStoreException)
    def handle_smartstore_exception(error):
        """处理SmartStore自定义异常"""
        logger.error(f"SmartStore异常: {error.message}")
        response = {
            'success': False,
            'error': {
                'code': error.code,
                'message': error.message
            }
        }
        return jsonify(response), error.code
    
    @app.errorhandler(404)
    def handle_not_found(error):
        """处理404错误"""
        logger.warning(f"资源未找到: {error}")
        response = {
            'success': False,
            'error': {
                'code': 404,
                'message': '请求的资源不存在'
            }
        }
        return jsonify(response), 404
    
    @app.errorhandler(500)
    def handle_internal_error(error):
        """处理500错误"""
        logger.error(f"服务器内部错误: {error}")
        response = {
            'success': False,
            'error': {
                'code': 500,
                'message': '服务器内部错误'
            }
        }
        return jsonify(response), 500
    
    @app.errorhandler(Exception)
    def handle_exception(error):
        """处理所有未捕获的异常"""
        logger.exception(f"未处理的异常: {error}")
        response = {
            'success': False,
            'error': {
                'code': 500,
                'message': '发生未知错误'
            }
        }
        return jsonify(response), 500


def success_response(data=None, message='操作成功'):
    """
    生成成功响应
    
    Args:
        data: 响应数据
        message: 响应消息
        
    Returns:
        JSON响应
    """
    response = {
        'success': True,
        'message': message
    }
    if data is not None:
        response['data'] = data
    return jsonify(response)


def error_response(message='操作失败', code=400):
    """
    生成错误响应
    
    Args:
        message: 错误消息
        code: 错误代码
        
    Returns:
        JSON响应和状态码
    """
    response = {
        'success': False,
        'error': {
            'code': code,
            'message': message
        }
    }
    return jsonify(response), code
