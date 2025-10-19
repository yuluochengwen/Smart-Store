# SmartStore API 文档

## 概述
SmartStore是一个智能无人商店系统，提供顾客检测、商品识别、语音交互、智能结算等功能。

## API基础信息
- 基础URL: `http://localhost:5000/api/v1`
- 数据格式: JSON
- 字符编码: UTF-8

## 通用响应格式

### 成功响应
```json
{
    "success": true,
    "message": "操作成功",
    "data": {}
}
```

### 错误响应
```json
{
    "success": false,
    "error": {
        "code": 400,
        "message": "错误描述"
    }
}
```

## API端点

### 1. 健康检查
- **URL**: `/health`
- **方法**: GET
- **描述**: 检查系统运行状态
- **响应**:
```json
{
    "success": true,
    "data": {
        "status": "healthy"
    }
}
```

### 2. 顾客检测
- **URL**: `/customer/detect`
- **方法**: POST
- **描述**: 检测摄像头中的顾客数量
- **请求体**: 图像数据（Base64或文件上传）
- **响应**:
```json
{
    "success": true,
    "data": {
        "count": 2,
        "detections": [
            {
                "bbox": [100, 150, 300, 450],
                "confidence": 0.95
            }
        ]
    }
}
```

### 3. 商品识别
- **URL**: `/commodity/recognize`
- **方法**: POST
- **描述**: 识别图像中的商品
- **响应**:
```json
{
    "success": true,
    "data": {
        "commodities": [
            {
                "id": 1,
                "name": "可口可乐",
                "confidence": 0.92
            }
        ]
    }
}
```

### 4. 语音问答
- **URL**: `/voice/ask`
- **方法**: POST
- **描述**: 回答用户的语音问题
- **请求体**:
```json
{
    "question": "这瓶可乐多少钱？"
}
```
- **响应**:
```json
{
    "success": true,
    "data": {
        "answer": "可口可乐价格3元，位于A区3号货架"
    }
}
```

### 5. 获取购物篮
- **URL**: `/basket/<user_id>`
- **方法**: GET
- **描述**: 获取用户的购物篮内容
- **响应**:
```json
{
    "success": true,
    "data": {
        "items": [
            {
                "commodity_id": 1,
                "name": "可口可乐",
                "quantity": 2,
                "unit_price": 3.0,
                "total_price": 6.0
            }
        ],
        "total": 6.0
    }
}
```

### 6. 人脸支付
- **URL**: `/payment/face`
- **方法**: POST
- **描述**: 通过人脸识别完成支付
- **请求体**:
```json
{
    "amount": 6.0,
    "face_image": "base64_encoded_image"
}
```
- **响应**:
```json
{
    "success": true,
    "data": {
        "transaction_no": "FACE20251018123456",
        "user_name": "张三",
        "amount": 6.0,
        "balance": 94.0
    }
}
```

### 7. 商品推荐
- **URL**: `/recommend`
- **方法**: POST
- **描述**: 根据用户需求推荐商品
- **请求体**:
```json
{
    "query": "推荐一款电解质饮料"
}
```
- **响应**:
```json
{
    "success": true,
    "data": {
        "recommendations": [
            {
                "id": 5,
                "name": "宝矿力水特",
                "price": 5.0,
                "location": "A区5号货架"
            }
        ]
    }
}
```

### 8. 获取商品列表
- **URL**: `/commodities`
- **方法**: GET
- **描述**: 获取所有商品信息
- **响应**:
```json
{
    "success": true,
    "data": {
        "commodities": [
            {
                "id": 1,
                "name": "可口可乐",
                "category": "饮料",
                "price": 3.0,
                "stock": 50,
                "location": "A区3号货架"
            }
        ]
    }
}
```

## 错误码说明
- 400: 请求参数错误
- 401: 未授权
- 403: 权限不足
- 404: 资源不存在
- 500: 服务器内部错误

## 注意事项
1. 所有POST请求需要设置 `Content-Type: application/json`
2. 图像数据建议使用Base64编码传输
3. API限流: 每个IP每分钟最多100次请求
4. 建议使用HTTPS传输敏感数据
