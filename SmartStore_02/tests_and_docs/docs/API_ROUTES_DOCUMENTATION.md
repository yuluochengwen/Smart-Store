# SmartStore_02 API 路由文档

> **项目名称**: SmartStore 智能无人商店系统  
> **版本**: v1.2  
> **基础URL**: `http://127.0.0.1:5000`  
> **更新时间**: 2025-10-21

---

## 目录

1. [页面路由 (HTML Pages)](#页面路由)
2. [系统 API](#系统-api)
3. [顾客管理 API](#顾客管理-api)
4. [商品管理 API](#商品管理-api)
5. [语音交互 API](#语音交互-api)
6. [支付相关 API](#支付相关-api)
7. [管理后台 API](#管理后台-api)
8. [数据模型](#数据模型)
9. [错误码说明](#错误码说明)

---

## 页面路由

### 1. 主页

```http
GET /
```

**描述**: 用户前台主页，展示实时人脸识别和商品推荐

**返回**: `index.html` 页面

**功能**:
- 实时人脸识别检测
- 显示检测到的顾客数量
- 已注册用户识别与欢迎
- 用户主动注册入口
- 商品推荐展示

---

### 2. 管理后台

```http
GET /admin
```

**描述**: 管理员后台界面

**返回**: `admin.html` 页面

**功能**:
- 统计数据展示（销售额、订单数、用户数、商品数）
- 最近交易记录
- 用户管理（查询、筛选）
- 交易记录查询（日期筛选）
- 库存管理（查看、预警）
- 商品管理（增删改查）

---

### 3. 人脸识别测试页

```http
GET /test/face
```

**描述**: 人脸识别功能测试页面

**返回**: `test_face.html` 页面

**用途**: 调试和测试人脸识别功能

---

### 4. 调试页面

```http
GET /debug
```

**描述**: 系统调试页面

**返回**: `debug.html` 页面

**用途**: 开发和调试系统各模块

---

## 系统 API

### 健康检查

```http
GET /api/v1/health
```

**描述**: 检查系统运行状态

**响应**:

```json
{
  "success": true,
  "message": "系统运行正常",
  "data": {
    "status": "healthy"
  }
}
```

---

## 顾客管理 API

### 1. 顾客检测与识别

```http
POST /api/v1/customer/detect
```

**描述**: 人脸检测和识别API，支持两种模式：
1. **识别模式**（默认）：检测人脸并在数据库中查找匹配用户
2. **注册模式**（skip_recognition=true）：仅提取人脸特征，不进行数据库比对

**请求头**:
```http
Content-Type: application/json
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `image` | String | 是 | Base64编码的图像数据（不含前缀） |
| `skip_recognition` | Boolean | 否 | 是否跳过数据库比对（注册模式使用），默认 false |

**请求示例**:

```json
{
  "image": "iVBORw0KGgoAAAANSUhEUgAA...",
  "skip_recognition": false
}
```

**响应示例（识别成功）**:

```json
{
  "success": true,
  "message": "欢迎回来，张三！",
  "data": {
    "face_count": 1,
    "recognized": true,
    "user": {
      "id": 1,
      "name": "张三",
      "phone": "13800138000",
      "email": "zhangsan@example.com",
      "role": "member",
      "balance": 1000.50,
      "created_at": "2025-10-20 10:30:00"
    },
    "distance": 6.2341
  }
}
```

**响应示例（未识别）**:

```json
{
  "success": true,
  "message": "检测到新顾客",
  "data": {
    "face_count": 1,
    "recognized": false,
    "faces": [{
      "encoding": [0.123, 0.234, ...],
      "confidence": 0.99
    }]
  }
}
```

**响应示例（注册模式）**:

```json
{
  "success": true,
  "message": "人脸特征提取成功",
  "data": {
    "face_count": 1,
    "recognized": false,
    "faces": [{
      "encoding": [0.123, 0.234, ...],
      "confidence": 0.99
    }]
  }
}
```

**识别算法**:
- 模型: DeepFace + Facenet
- 特征维度: 128维
- 距离算法: 欧氏距离 (Euclidean Distance)
- 识别阈值: 10.0
- 检测器: OpenCV
- 置信度阈值: 0.9

---

### 2. 顾客注册

```http
POST /api/v1/customer/register
```

**描述**: 注册新顾客，保存人脸特征到数据库

**请求头**:
```http
Content-Type: application/json
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | String | 是 | 顾客姓名 |
| `phone` | String | 否 | 手机号（唯一） |
| `email` | String | 否 | 邮箱（唯一） |
| `face_encoding` | Array | 是 | 人脸特征向量（128维浮点数组） |

**请求示例**:

```json
{
  "name": "李四",
  "phone": "13900139000",
  "email": "lisi@example.com",
  "face_encoding": [0.123, 0.234, 0.345, ...]
}
```

**响应示例（成功）**:

```json
{
  "success": true,
  "message": "注册成功！欢迎来到 SmartStore！",
  "data": {
    "user": {
      "id": 2,
      "name": "李四",
      "phone": "13900139000",
      "email": "lisi@example.com",
      "role": "member",
      "balance": 0.0,
      "created_at": "2025-10-21 14:30:00"
    }
  }
}
```

**响应示例（手机号已存在）**:

```json
{
  "success": false,
  "message": "该手机号已注册",
  "error_code": 400
}
```

**验证规则**:
- 姓名不能为空
- 人脸特征不能为空
- 手机号唯一（如果提供）
- 邮箱唯一（如果提供）
- 默认角色: member
- 初始余额: 0.0

---

## 商品管理 API

### 1. 获取商品列表

```http
GET /api/v1/commodities
```

**描述**: 获取商品列表，支持搜索

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `search` | String | 否 | 商品名称搜索关键词 |

**请求示例**:

```http
GET /api/v1/commodities?search=可乐
```

**响应示例**:

```json
{
  "success": true,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "name": "可口可乐",
      "category": "饮料",
      "price": 3.50,
      "stock": 100,
      "location": "A1-01",
      "created_at": "2025-10-20 10:00:00"
    },
    {
      "id": 2,
      "name": "百事可乐",
      "category": "饮料",
      "price": 3.50,
      "stock": 80,
      "location": "A1-02",
      "created_at": "2025-10-20 10:00:00"
    }
  ]
}
```

---

### 2. 商品识别

```http
POST /api/v1/commodity/recognize
```

**描述**: 通过图像识别商品（待实现）

**请求头**:
```http
Content-Type: application/json
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `image` | String | 是 | Base64编码的商品图像 |

**响应示例**:

```json
{
  "success": true,
  "message": "识别完成",
  "data": {
    "commodities": []
  }
}
```

> **注意**: 此功能当前为占位实现，待集成商品识别模型

---

### 3. 商品推荐

```http
POST /api/v1/recommend
```

**描述**: 基于用户查询推荐商品（使用 LLM）

**请求头**:
```http
Content-Type: application/json
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `query` | String | 是 | 用户查询（自然语言） |

**请求示例**:

```json
{
  "query": "我想买点喝的"
}
```

**响应示例**:

```json
{
  "success": true,
  "message": "推荐成功",
  "data": {
    "recommendations": [
      {
        "id": 1,
        "name": "可口可乐",
        "price": 3.50,
        "reason": "热门饮料，价格实惠"
      },
      {
        "id": 3,
        "name": "农夫山泉",
        "price": 2.00,
        "reason": "健康天然矿泉水"
      }
    ]
  }
}
```

**推荐引擎**:
- 使用 jieba 分词
- 基于关键词匹配
- 考虑商品类别、名称、描述

---

## 语音交互 API

### 语音问答

```http
POST /api/v1/voice/ask
```

**描述**: 语音问答功能，回答用户问题

**请求头**:
```http
Content-Type: application/json
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `question` | String | 是 | 用户问题 |

**请求示例**:

```json
{
  "question": "你们有什么饮料？"
}
```

**响应示例**:

```json
{
  "success": true,
  "message": "回答成功",
  "data": {
    "answer": "我们有可口可乐、百事可乐、农夫山泉等多种饮料，您想要哪一种呢？"
  }
}
```

---

## 支付相关 API

### 1. 获取购物篮

```http
GET /api/v1/basket/{user_id}
```

**描述**: 获取用户购物篮详情

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `user_id` | Integer | 是 | 用户ID |

**请求示例**:

```http
GET /api/v1/basket/1
```

**响应示例**:

```json
{
  "success": true,
  "message": "获取购物篮成功",
  "data": {
    "items": [
      {
        "commodity_id": 1,
        "name": "可口可乐",
        "price": 3.50,
        "quantity": 2,
        "subtotal": 7.00
      },
      {
        "commodity_id": 3,
        "name": "农夫山泉",
        "price": 2.00,
        "quantity": 1,
        "subtotal": 2.00
      }
    ],
    "total": 9.00
  }
}
```

---

### 2. 人脸支付

```http
POST /api/v1/payment/face
```

**描述**: 人脸识别支付（待完善实现）

**请求头**:
```http
Content-Type: application/json
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `amount` | Float | 是 | 支付金额 |
| `image` | String | 是 | Base64编码的人脸图像 |

**请求示例**:

```json
{
  "amount": 9.00,
  "image": "iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**响应示例**:

```json
{
  "success": true,
  "message": "支付成功",
  "data": {
    "success": true
  }
}
```

> **注意**: 此功能待完善，需集成人脸识别 + 账户扣款逻辑

---

## 管理后台 API

### 1. 统计数据

```http
GET /api/v1/admin/stats
```

**描述**: 获取系统统计数据

**响应示例**:

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "today_sales": 1258.50,
    "today_orders": 42,
    "total_users": 156,
    "total_commodities": 89
  }
}
```

**字段说明**:
- `today_sales`: 今日销售额（元）
- `today_orders`: 今日订单数
- `total_users`: 总用户数
- `total_commodities`: 总商品数

---

### 2. 最近交易

```http
GET /api/v1/admin/recent-transactions
```

**描述**: 获取最近5条交易记录

**响应示例**:

```json
{
  "success": true,
  "message": "获取成功",
  "data": [
    {
      "id": 25,
      "user_name": "张三",
      "amount": 15.50,
      "created_at": "2025-10-21 14:25:30"
    },
    {
      "id": 24,
      "user_name": "李四",
      "amount": 28.00,
      "created_at": "2025-10-21 13:50:12"
    }
  ]
}
```

---

### 3. 用户列表

```http
GET /api/v1/admin/users
```

**描述**: 获取用户列表，支持搜索和角色筛选

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `search` | String | 否 | 搜索关键词（姓名、手机号） |
| `role` | String | 否 | 角色筛选（admin/member/guest） |

**请求示例**:

```http
GET /api/v1/admin/users?search=张&role=member
```

**响应示例**:

```json
{
  "success": true,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "name": "张三",
      "phone": "13800138000",
      "email": "zhangsan@example.com",
      "role": "member",
      "balance": 1000.50,
      "created_at": "2025-10-20 10:30:00"
    }
  ]
}
```

---

### 4. 交易记录

```http
GET /api/v1/admin/transactions
```

**描述**: 获取交易记录，支持日期筛选

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `start_date` | String | 否 | 开始日期（YYYY-MM-DD） |
| `end_date` | String | 否 | 结束日期（YYYY-MM-DD） |

**请求示例**:

```http
GET /api/v1/admin/transactions?start_date=2025-10-01&end_date=2025-10-21
```

**响应示例**:

```json
{
  "success": true,
  "message": "获取成功",
  "data": [
    {
      "id": 25,
      "user_name": "张三",
      "amount": 15.50,
      "payment_method": "face",
      "status": "completed",
      "created_at": "2025-10-21 14:25:30"
    }
  ]
}
```

---

### 5. 库存管理

```http
GET /api/v1/admin/inventory
```

**描述**: 获取库存信息和预警

**响应示例**:

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "total_value": 15680.50,
    "low_stock_count": 5,
    "out_stock_count": 2,
    "items": [
      {
        "id": 1,
        "name": "可口可乐",
        "stock": 5,
        "safe_stock": 10,
        "price": 3.50
      }
    ]
  }
}
```

**字段说明**:
- `total_value`: 库存总价值（元）
- `low_stock_count`: 低库存商品数（库存 < 10）
- `out_stock_count`: 缺货商品数（库存 = 0）
- `safe_stock`: 安全库存线（默认10）

---

### 6. 商品管理

#### 6.1 添加商品

```http
POST /api/v1/admin/commodities
```

**请求头**:
```http
Content-Type: application/json
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | String | 是 | 商品名称 |
| `category` | String | 否 | 商品类别 |
| `price` | Float | 是 | 商品价格 |
| `stock` | Integer | 是 | 库存数量 |
| `location` | String | 否 | 货架位置 |

**请求示例**:

```json
{
  "name": "雪碧",
  "category": "饮料",
  "price": 3.50,
  "stock": 50,
  "location": "A1-03"
}
```

**响应示例**:

```json
{
  "success": true,
  "message": "添加成功",
  "data": {
    "id": 10,
    "name": "雪碧",
    "category": "饮料",
    "price": 3.50,
    "stock": 50,
    "location": "A1-03",
    "created_at": "2025-10-21 15:00:00"
  }
}
```

---

#### 6.2 获取商品详情

```http
GET /api/v1/admin/commodities/{commodity_id}
```

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `commodity_id` | Integer | 是 | 商品ID |

**请求示例**:

```http
GET /api/v1/admin/commodities/1
```

**响应示例**:

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "id": 1,
    "name": "可口可乐",
    "category": "饮料",
    "price": 3.50,
    "stock": 100,
    "location": "A1-01",
    "created_at": "2025-10-20 10:00:00"
  }
}
```

---

#### 6.3 更新商品

```http
PUT /api/v1/admin/commodities/{commodity_id}
```

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `commodity_id` | Integer | 是 | 商品ID |

**请求头**:
```http
Content-Type: application/json
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | String | 否 | 商品名称 |
| `category` | String | 否 | 商品类别 |
| `price` | Float | 否 | 商品价格 |
| `stock` | Integer | 否 | 库存数量 |
| `location` | String | 否 | 货架位置 |

**请求示例**:

```json
{
  "price": 4.00,
  "stock": 120
}
```

**响应示例**:

```json
{
  "success": true,
  "message": "更新成功",
  "data": {
    "id": 1,
    "name": "可口可乐",
    "category": "饮料",
    "price": 4.00,
    "stock": 120,
    "location": "A1-01",
    "created_at": "2025-10-20 10:00:00"
  }
}
```

---

#### 6.4 删除商品

```http
DELETE /api/v1/admin/commodities/{commodity_id}
```

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `commodity_id` | Integer | 是 | 商品ID |

**请求示例**:

```http
DELETE /api/v1/admin/commodities/10
```

**响应示例**:

```json
{
  "success": true,
  "message": "删除成功",
  "data": {}
}
```

---

## 数据模型

### User (用户)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | Integer | 用户ID（主键） |
| `name` | String | 用户姓名 |
| `phone` | String | 手机号（唯一） |
| `email` | String | 邮箱（唯一） |
| `role` | Enum | 角色（admin/member/guest） |
| `balance` | Decimal | 账户余额 |
| `face_encoding` | Text | 人脸特征（JSON格式） |
| `created_at` | DateTime | 创建时间 |
| `updated_at` | DateTime | 更新时间 |

---

### Commodity (商品)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | Integer | 商品ID（主键） |
| `name` | String | 商品名称 |
| `category` | String | 商品类别 |
| `price` | Decimal | 商品价格 |
| `stock` | Integer | 库存数量 |
| `location` | String | 货架位置 |
| `created_at` | DateTime | 创建时间 |
| `updated_at` | DateTime | 更新时间 |

---

### Transaction (交易)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | Integer | 交易ID（主键） |
| `user_id` | Integer | 用户ID（外键） |
| `total_amount` | Decimal | 交易金额 |
| `payment_method` | Enum | 支付方式（face/qrcode/cash） |
| `status` | Enum | 交易状态（pending/completed/failed） |
| `created_at` | DateTime | 创建时间 |
| `updated_at` | DateTime | 更新时间 |

---

## 错误码说明

### 标准响应格式

**成功响应**:

```json
{
  "success": true,
  "message": "操作描述",
  "data": { /* 响应数据 */ }
}
```

**错误响应**:

```json
{
  "success": false,
  "message": "错误描述",
  "error_code": 400
}
```

---

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| `200` | 请求成功 |
| `400` | 请求参数错误 |
| `404` | 资源不存在 |
| `500` | 服务器内部错误 |

---

### 业务错误码

| 错误码 | 说明 |
|--------|------|
| `400` | 参数错误、验证失败 |
| `404` | 资源不存在 |
| `409` | 资源冲突（如手机号已存在） |

---

## 技术栈

### 后端

- **框架**: Flask 3.0.3
- **数据库**: MySQL + SQLAlchemy ORM
- **人脸识别**: DeepFace 0.0.79 + Facenet
- **图像处理**: OpenCV, PIL
- **分词**: jieba
- **跨域**: Flask-CORS

### 前端

- **库**: jQuery 3.6.0
- **UI**: 原生 HTML5 + CSS3
- **视频**: getUserMedia API

---

## 注意事项

1. **人脸识别**:
   - 首次使用会下载 Facenet 模型（~100MB）
   - 建议在光线充足环境下使用
   - 人脸检测置信度阈值: 0.9
   - 人脸识别距离阈值: 10.0

2. **注册模式**:
   - 使用 `skip_recognition: true` 跳过数据库比对
   - 避免因相似度高而误判为已注册用户
   - 推荐用于主动注册场景

3. **管理后台**:
   - 需要确保数据库连接正常
   - 使用 `get_db_connector()` 获取数据库实例
   - 所有查询使用 `session_scope()` 上下文管理器

4. **性能优化**:
   - 人脸识别耗时约 1-3 秒
   - 商品推荐使用缓存机制
   - 数据库查询使用索引

---

## 更新日志

### v1.2 (2025-10-21)

- ✅ 修复管理后台数据库连接错误
- ✅ 添加注册模式（skip_recognition 参数）
- ✅ 优化人脸识别流程
- ✅ 添加用户主动注册功能
- ✅ 完善 API 文档

### v1.1 (2025-10-20)

- ✅ 实现人脸识别检测
- ✅ 实现用户注册
- ✅ 实现管理后台
- ✅ 实现商品管理 CRUD

### v1.0 (2025-10-19)

- ✅ 项目初始化
- ✅ 数据库模型设计
- ✅ 基础路由搭建

---

## 开发团队

**项目**: SmartStore 智能无人商店系统  
**仓库**: yuluochengwen/Smart-Store  
**分支**: wen

---

**文档版本**: v1.2  
**最后更新**: 2025-10-21
