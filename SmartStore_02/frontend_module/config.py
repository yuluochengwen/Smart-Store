# 智能购物系统配置文件

# Flask配置
SECRET_KEY = 'your-secret-key-here-change-in-production'
DEBUG = True
PORT = 5000
HOST = '0.0.0.0'

# 数据库配置
DATABASE_URL = 'sqlite:///smart_shop.db'

# 上传配置
UPLOAD_FOLDER = 'uploads'
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB

# AI配置
AI_MODEL_PATH = 'models/yolov8.pt'
CONFIDENCE_THRESHOLD = 0.7

# 摄像头配置
CAMERA_WIDTH = 1280
CAMERA_HEIGHT = 720
FPS = 30

# 日志配置
LOG_LEVEL = 'INFO'
LOG_FILE = 'logs/app.log'

# 其他配置
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
SESSION_TIMEOUT = 3600  # 1小时
