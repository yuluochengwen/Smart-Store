# 智能购物系统

基于AI视觉识别的智能购物系统，提供商品自动识别、智能购物车、AI购物助手、人流量监控等功能的完整解决方案。

## 🌟 功能特性

### 客户端功能
- **实时商品识别**: 通过摄像头自动识别商品并显示信息
- **智能购物车**: 自动添加识别到的商品到购物清单
- **AI购物助手**: 智能对话，提供商品推荐和购物建议
- **多种支付方式**: 支持微信、支付宝、银行卡支付
- **实时统计**: 显示今日识别次数、成功率等数据

### 管理端功能
- **仪表盘**: 实时显示销售额、订单数、用户数等关键指标
- **人流量监控**: 实时监控进入/离开人数，支持历史数据分析
- **库存管理**: 库存预警、商品管理、库存统计
- **用户管理**: 用户列表、权限管理、用户行为分析
- **交易记录**: 订单管理、支付状态跟踪、订单导出
- **商品管理**: 商品CRUD、分类管理、热销排行
- **AI助手**: 智能客服、自动回复、对话记录

## 🏗️ 技术架构

### 前端技术栈
- **HTML5 + CSS3**: 响应式布局，现代化UI设计
- **JavaScript (ES6+)**: 动态交互，实时数据更新
- **Tailwind CSS**: 原子化CSS框架，快速样式开发
- **Font Awesome**: 图标库
- **Canvas/WebGL**: 数据可视化图表

### 后端技术栈
- **Flask**: Python微框架，轻量高效
- **SQLite**: 轻量级数据库，适合中小型应用
- **OpenCV**: 计算机视觉库，图像处理
- **NumPy**: 科学计算库
- **AI模型**: 支持YOLO等目标检测模型

### 系统架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   客户端界面    │    │   管理端界面    │    │   移动端界面    │
│   (HTML/CSS/JS) │    │   (HTML/CSS/JS) │    │   (响应式)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Flask后端     │
                    │   (RESTful API) │
                    └─────────────────┘
                                 │
            ┌────────────────────┼────────────────────┐
            │                    │                    │
    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
    │   数据库层   │    │   AI识别层   │    │   缓存层     │
    │   (SQLite)   │    │   (OpenCV)   │    │   (Redis)    │
    └──────────────┘    └──────────────┘    └──────────────┘
```

## 📁 项目结构

```
智能购物系统/
├── backend/                    # 后端代码
│   ├── app.py                 # Flask主应用
│   ├── run.py                 # 启动脚本
│   ├── config.py              # 配置文件
│   ├── requirements.txt       # 依赖包列表
│   ├── routes/                # 路由模块
│   │   ├── __init__.py
│   │   ├── auth.py           # 认证路由
│   │   ├── client.py         # 客户端路由
│   │   ├── admin.py          # 管理端路由
│   │   └── api.py            # API路由
│   ├── utils/                 # 工具模块
│   │   ├── __init__.py
│   │   ├── database.py       # 数据库工具
│   │   ├── camera.py         # 摄像头工具
│   │   └── ai_detection.py   # AI检测工具
│   ├── models/                # 数据模型
│   │   ├── __init__.py
│   │   ├── user.py           # 用户模型
│   │   ├── product.py        # 商品模型
│   │   └── order.py          # 订单模型
│   └── static/                # 静态文件
│       ├── css/
│       ├── js/
│       └── images/
├── frontend/                  # 前端代码
│   ├── client/               # 客户端界面
│   │   ├── index.html        # 主页面
│   │   ├── styles.css        # 样式文件
│   │   └── script.js         # 脚本文件
│   └── admin/                # 管理端界面
│       ├── login.html        # 登录页面
│       ├── dashboard.html    # 仪表盘
│       ├── traffic.html      # 人流量监控
│       ├── inventory.html    # 库存管理
│       ├── users.html        # 用户管理
│       ├── orders.html       # 交易记录
│       ├── products.html     # 商品管理
│       ├── styles.css        # 公共样式
│       └── script.js         # 公共脚本
├── uploads/                   # 上传文件目录
├── logs/                     # 日志文件目录
├── backups/                  # 备份文件目录
├── start.sh                  # 启动脚本
├── README.md                 # 项目说明
└── LICENSE                   # 许可证
```

## 🚀 快速开始

### 环境要求
- Python 3.6+
- Flask 2.0+
- SQLite3
- OpenCV 4.0+

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/yourusername/smart-shopping-system.git
cd smart-shopping-system
```

2. **安装依赖**
```bash
cd backend
pip install -r requirements.txt
```

3. **初始化数据库**
```bash
python -c "
from utils.database import db_manager
from utils.camera import init_camera_system
from utils.ai_detection import init_ai_system

db_manager.init_database()
init_camera_system()
init_ai_system()
"
```

4. **启动应用**
```bash
# 开发模式
python run.py --debug --reload

# 生产模式
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

5. **访问应用**
- 客户端: http://localhost:5000/client
- 管理端: http://localhost:5000/admin

### 使用启动脚本
```bash
# 赋予执行权限
chmod +x start.sh

# 运行启动脚本
./start.sh
```

## 📖 使用说明

### 客户端使用
1. **启动商品识别**: 点击"开始识别"按钮，系统自动连接摄像头
2. **添加商品**: 将商品放入摄像头区域，系统自动识别并添加到购物车
3. **AI助手**: 点击AI助手图标，可以询问商品推荐、价格等信息
4. **结算支付**: 点击"去结算"，选择支付方式完成购买

### 管理端使用
1. **登录系统**: 使用管理员账号登录后台
2. **查看仪表盘**: 查看实时销售数据、用户统计等
3. **监控人流量**: 实时查看进入/离开人数，分析客流趋势
4. **管理库存**: 查看库存状态，处理库存预警
5. **用户管理**: 管理用户信息，设置用户权限
6. **订单管理**: 查看订单详情，处理订单状态

## 🔧 配置说明

### 数据库配置
```python
# config.py
DATABASE_URL = 'sqlite:///smart_shop.db'  # 数据库路径
```

### 摄像头配置
```python
# config.py
CAMERA_ID = 0  # 摄像头ID
CAMERA_WIDTH = 1280  # 宽度
CAMERA_HEIGHT = 720  # 高度
CAMERA_FPS = 30  # 帧率
```

### AI模型配置
```python
# config.py
AI_MODEL_PATH = 'models/yolov8.pt'  # 模型路径
CONFIDENCE_THRESHOLD = 0.7  # 置信度阈值
```

## 📊 数据模型

### 用户表 (users)
- id: 主键
- username: 用户名
- email: 邮箱
- password: 密码
- role: 角色（管理员/经理/普通用户）
- status: 状态（active/inactive）
- avatar: 头像
- phone: 手机号
- remark: 备注
- created_at: 创建时间
- last_login: 最后登录时间

### 商品表 (products)
- id: 主键
- name: 商品名称
- price: 价格
- category: 分类
- stock: 库存
- status: 状态（active/inactive）
- icon: 图标
- unit: 单位
- barcode: 条形码
- description: 描述
- created_at: 创建时间

### 订单表 (orders)
- id: 订单号
- customer_name: 客户姓名
- customer_phone: 客户电话
- customer_address: 客户地址
- amount: 订单金额
- status: 状态（paid/unpaid/cancelled）
- payment_method: 支付方式
- payment_time: 支付时间
- transaction_id: 交易号
- created_at: 创建时间

## 🔒 安全特性

- **用户认证**: 基于session的用户登录认证
- **权限控制**: 基于角色的访问控制（RBAC）
- **数据验证**: 输入数据验证和过滤
- **SQL注入防护**: 使用参数化查询
- **XSS防护**: 输出内容转义
- **CSRF防护**: 表单token验证

## 📈 性能优化

- **数据库优化**: 索引优化、查询优化
- **缓存机制**: Redis缓存热点数据
- **异步处理**: 异步任务队列处理耗时操作
- **图片优化**: 图片压缩、懒加载
- **前端优化**: 代码压缩、资源合并

## 🧪 测试

### 单元测试
```bash
# 运行所有测试
pytest

# 运行指定模块测试
pytest tests/test_auth.py

# 生成测试报告
pytest --cov=backend --cov-report=html
```

### 集成测试
```bash
# 启动测试服务器
python run.py --testing

# 运行API测试
python tests/test_api.py
```

## 📚 API文档

### 认证API
- `POST /api/login`: 用户登录
- `POST /api/register`: 用户注册
- `POST /api/logout`: 用户登出

### 商品API
- `GET /api/products`: 获取商品列表
- `POST /api/products`: 创建商品
- `GET /api/products/<id>`: 获取商品详情
- `PUT /api/products/<id>`: 更新商品
- `DELETE /api/products/<id>`: 删除商品

### 订单API
- `GET /api/orders`: 获取订单列表
- `POST /api/orders`: 创建订单
- `GET /api/orders/<id>`: 获取订单详情
- `PUT /api/orders/<id>`: 更新订单

## 🚀 部署

### Docker部署
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "run.py", "--host", "0.0.0.0", "--port", "5000"]
```

### 生产环境部署
1. 使用Gunicorn作为WSGI服务器
2. 配置Nginx反向代理
3. 使用Supervisor进程管理
4. 配置SSL证书

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 👥 作者

- **智能购物系统团队** - 初始工作 - [SmartShoppingTeam](https://github.com/SmartShoppingTeam)

## 🙏 致谢

- 感谢所有贡献者的支持和帮助
- 感谢开源社区提供的优秀工具和库
- 特别感谢测试用户的反馈和建议

## 📞 联系方式

- 项目地址: https://github.com/yourusername/smart-shopping-system
- 邮箱: team@smartshopping.com
- 技术支持: support@smartshopping.com

---

**⭐ 如果这个项目对你有帮助，请给个星标支持一下！**