# SmartStore 系统设计文档

## 1. 系统概述

SmartStore是一个基于计算机视觉、语音交互和人工智能技术的智能无人商店系统。系统实现了自动识别顾客、商品检测与识别、语音交互、智能结算等功能。

## 2. 技术架构

### 2.1 技术栈
- **后端框架**: Flask 3.0.0
- **数据库**: MySQL + SQLAlchemy ORM
- **计算机视觉**: OpenCV, YOLO v8, face-recognition
- **深度学习**: PyTorch 2.1.0
- **语音识别**: Google Speech Recognition, Whisper
- **文字转语音**: Edge TTS
- **LLM集成**: OpenAI API, LangChain
- **前端**: HTML5, CSS3, jQuery

### 2.2 系统架构图
```
┌─────────────────────────────────────────────────────────┐
│                      前端层                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ 主页界面  │  | 管理后台   │  │ 移动端    │               │
│  └──────────┘  └──────────┘  └──────────┘               │
└─────────────────────────────────────────────────────────┘
                        │
┌─────────────────────────────────────────────────────────┐
│                    应用入口层                             │
│  ┌────────────────────────────────────────────────┐     │
│  │          Flask Application (main.py)           │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐      │     │
│  │  │ 路由管理  │  │ 中间件     │ │ 错误处理   │      │     │
│  │  └──────────┘  └──────────┘  └──────────┘      │     │
│  └────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
                        │
┌─────────────────────────────────────────────────────────┐
│                    核心模块层                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │顾客检测   │  │商品检测   │  │语音交互   │              │
│  │模块      │  │模块      │  │模块      │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│  ┌──────────┐  ┌──────────┐                            │
│  │智能结算   │  │个性化     │                            │
│  │模块      │  │定制模块   │                            │
│  └──────────┘  └──────────┘                            │
└─────────────────────────────────────────────────────────┘
                        │
┌─────────────────────────────────────────────────────────┐
│                    公共模块层                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ 配置管理  │  │ 日志工具  │  │ 异常处理  │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│  ┌──────────┐  ┌──────────┐                            │
│  │ 图像工具  │  │ 文本工具  │                            │
│  └──────────┘  └──────────┘                            │
└─────────────────────────────────────────────────────────┘
                        │
┌─────────────────────────────────────────────────────────┐
│                    数据层                                 │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │  数据库连接       │  │  文件存储         │            │
│  │  ┌───────────┐   │  │  ┌───────────┐   │            │
│  │  │ MySQL     │   │  │  │ 用户图片   │   │            │
│  │  │ SQLAlchemy│   │  │  │ 生成图片   │   │            │
│  │  └───────────┘   │  │  │ 日志文件   │   │            │
│  └──────────────────┘  └──┴───────────┴───┘            │
└─────────────────────────────────────────────────────────┘
```

## 3. 核心模块设计

### 3.1 顾客检测模块 (customer_detection)
**功能**: 检测顾客进出、识别会员身份、处理支付

**子模块**:
- `detection/`: 顾客检测与跟踪
  - `detector.py`: 使用YOLO检测人员
  - `config.py`: 检测配置
  
- `identification/`: 身份识别
  - `face_recognition.py`: 人脸识别核心
  - `member_verify.py`: 会员验证
  
- `payment/`: 支付处理
  - `face_payment.py`: 人脸支付
  - `qrcode_payment.py`: 二维码支付

### 3.2 商品检测模块 (commodity_detection)
**功能**: 识别商品、管理购物篮、生成账单

**子模块**:
- `basket_management/`: 购物篮管理
  - `commodity_recognizer.py`: 商品识别
  - `basket_updater.py`: 购物篮更新
  
- `action_detection/`: 行为检测
  - `action_recognizer.py`: 识别拿取/放回动作
  - `event_handler.py`: 事件处理
  
- `billing/`: 账单管理
  - `bill_generator.py`: 账单生成
  - `bill_template.py`: 账单模板

### 3.3 语音交互模块 (voice_interaction)
**功能**: 语音识别、自然语言理解、语音合成

**子模块**:
- `speech_recognition/`: 语音识别
  - `asr.py`: 自动语音识别
  - `noise_filter.py`: 噪音过滤
  
- `llm_integration/`: LLM集成
  - `question_answering.py`: 问答系统
  - `commodity_recommender.py`: 商品推荐
  
- `text_to_speech/`: 语音合成
  - `tts.py`: 文字转语音
  - `voice_config.py`: 语音配置

### 3.4 智能结算模块 (smart_settlement)
**功能**: 自动结算、库存管理、数据分析

**子模块**:
- `settlement/`: 结算处理
  - `automatic_billing.py`: 自动账单
  
- `inventory_management/`: 库存管理
  - `inventory_updater.py`: 库存更新
  - `stock_analysis.py`: 销量分析
  - `purchase_suggestion.py`: 进货建议

### 3.5 个性化定制模块 (personalized_customization)
**功能**: 图片打印、文生图

**子模块**:
- `image_printing/`: 图片打印
  - `image_processor.py`: 图像处理
  - `print_controller.py`: 打印控制
  
- `text_to_image/`: 文生图
  - `txt2img_model.py`: Stable Diffusion集成
  - `image_selector.py`: 图片选择

## 4. 数据库设计

### 4.1 用户表 (users)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | VARCHAR(50) | 用户名 |
| phone | VARCHAR(20) | 手机号 |
| email | VARCHAR(100) | 邮箱 |
| role | ENUM | 角色(MEMBER/VIP/GUEST) |
| face_encoding | TEXT | 人脸编码 |
| balance | FLOAT | 账户余额 |
| created_at | DATETIME | 创建时间 |

### 4.2 商品表 (commodities)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | VARCHAR(100) | 商品名称 |
| barcode | VARCHAR(50) | 条码 |
| category | VARCHAR(50) | 类别 |
| price | FLOAT | 价格 |
| stock | INTEGER | 库存 |
| location | VARCHAR(50) | 位置 |
| description | TEXT | 描述 |

### 4.3 购买记录表 (purchase_records)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| user_id | INTEGER | 用户ID(外键) |
| commodity_id | INTEGER | 商品ID(外键) |
| quantity | INTEGER | 数量 |
| unit_price | FLOAT | 单价 |
| total_price | FLOAT | 总价 |
| status | ENUM | 状态 |

### 4.4 交易流水表 (transactions)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| user_id | INTEGER | 用户ID(外键) |
| transaction_no | VARCHAR(50) | 流水号 |
| total_amount | FLOAT | 总金额 |
| payment_method | ENUM | 支付方式 |
| status | ENUM | 状态 |
| created_at | DATETIME | 交易时间 |

## 5. 部署说明

### 5.1 环境要求
- Python 3.10+
- MySQL 8.0+
- 摄像头设备
- (可选) GPU支持

### 5.2 安装步骤
```bash
# 1. 克隆项目
git clone https://github.com/your-repo/SmartStore_02.git
cd SmartStore_02

# 2. 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. 安装依赖
pip install -r requirements.txt

# 4. 配置环境变量
cp .env.example .env
# 编辑.env文件，配置数据库等信息

# 5. 初始化数据库
python -c "from data_layer.database.db_connector import db_connector; db_connector.connect(); db_connector.init_db()"

# 6. 运行应用
python app_entry/main_app.py
```

### 5.3 访问地址
- 主页: http://localhost:5000
- 管理后台: http://localhost:5000/admin
- API文档: http://localhost:5000/api/v1/health

## 6. 性能优化建议
1. 使用GPU加速模型推理
2. 实现模型缓存和预加载
3. 优化数据库查询(添加索引)
4. 使用Redis缓存热点数据
5. 图像预处理和压缩

## 7. 安全考虑
1. API鉴权和访问控制
2. 人脸数据加密存储
3. SQL注入防护
4. XSS攻击防护
5. HTTPS传输

## 8. 未来扩展
1. 支持多商店管理
2. 移动端APP
3. 会员积分系统
4. 数据分析看板
5. AI推荐算法优化
