# 注册模式优化说明

## 修改内容

优化了用户注册流程，实现以下功能：
1. **点击"立即注册"时暂停主页面的人脸识别**
2. **注册时不进行数据库人脸比对，直接提取特征并注册**
3. **关闭注册模态框时恢复主页面的人脸识别**

---

## 实现细节

### 1. 前端修改 (`frontend/static/js/main.js`)

#### 1.1 添加暂停/恢复检测的状态管理

```javascript
// 新增变量
let detectionIntervalId = null;  // 保存定时器ID
let isDetectionPaused = false;   // 检测是否暂停
```

#### 1.2 修改检测逻辑

```javascript
// 在定时器中检查暂停状态
detectionIntervalId = setInterval(function() {
    // 如果检测被暂停，跳过本次检测
    if (isDetectionPaused) {
        return;
    }
    
    if (video.readyState === video.HAVE_ENOUGH_DATA && !isDetecting_api) {
        isDetecting_api = true;
        detectAndRecognizeFace(video, canvas, ctx, function() {
            isDetecting_api = false;
        });
    }
}, 2000);
```

#### 1.3 添加暂停/恢复函数

```javascript
// 暂停人脸检测
function pauseDetection() {
    isDetectionPaused = true;
    console.log('✋ 人脸检测已暂停');
}

// 恢复人脸检测
function resumeDetection() {
    isDetectionPaused = false;
    console.log('▶️ 人脸检测已恢复');
}
```

#### 1.4 修改注册模态框的打开/关闭逻辑

```javascript
// 打开注册模态框
function openRegistrationModal() {
    // 暂停主页面的人脸识别
    pauseDetection();
    console.log('📝 进入注册模式，主页面检测已暂停');
    
    $('#registration-modal').fadeIn();
    showStep('face');
    startRegisterCamera();
}

// 关闭注册模态框
function closeRegistrationModal() {
    // 恢复主页面的人脸识别
    resumeDetection();
    console.log('✅ 退出注册模式，主页面检测已恢复');
    
    $('#registration-modal').fadeOut();
    stopRegisterCamera();
    resetRegistrationForm();
}
```

#### 1.5 修改人脸拍摄逻辑（添加 skip_recognition 参数）

```javascript
// 拍摄人脸照片时，添加 skip_recognition: true
$.ajax({
    url: API_BASE + '/customer/detect',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ 
        image: imageData.split(',')[1],
        skip_recognition: true  // 跳过数据库比对
    }),
    success: function(response) {
        // 注册模式：不检查是否已注册，直接提取特征
        if (response.data.faces && response.data.faces.length > 0) {
            capturedFaceEncoding = response.data.faces[0].encoding;
            showCapturedFace(imageData);
            console.log('✅ 人脸特征提取成功（未进行数据库比对）');
        }
    }
});
```

---

### 2. 后端修改 (`app_entry/main_app.py`)

#### 2.1 添加 skip_recognition 参数支持

```python
@app.route('/api/v1/customer/detect', methods=['POST'])
def customer_detect():
    """顾客检测和识别API"""
    try:
        data = request.get_json()
        image_base64 = data.get('image')
        skip_recognition = data.get('skip_recognition', False)  # 是否跳过数据库比对
        
        if not image_base64:
            return error_response('未提供图像数据', 400)
```

#### 2.2 在提取特征后判断是否跳过比对

```python
# 提取人脸特征
face_embedding = DeepFace.represent(
    img_path=image_np,
    model_name='Facenet',
    enforce_detection=False
)[0]['embedding']

# 如果是注册模式（skip_recognition=True），直接返回特征，不进行数据库比对
if skip_recognition:
    logger.info("🔧 注册模式：跳过数据库比对，直接返回人脸特征")
    return success_response({
        'face_count': face_count,
        'recognized': False,
        'faces': [{
            'encoding': face_embedding,
            'confidence': main_face.get('confidence', 0)
        }]
    }, '人脸特征提取成功')

# 正常识别模式：在数据库中查找匹配的用户
# ... (原有的数据库比对逻辑)
```

---

## 工作流程

### 用户注册流程

```
1. 用户点击"立即注册"按钮
   ↓
2. 前端调用 pauseDetection()
   → 主页面人脸识别暂停
   → 停止向后端发送识别请求
   ↓
3. 注册模态框打开，启动注册专用摄像头
   ↓
4. 用户正对摄像头，点击"拍摄人脸"
   ↓
5. 前端发送请求到 /customer/detect
   → 携带参数 skip_recognition: true
   ↓
6. 后端检测到 skip_recognition=True
   → 只提取人脸特征（DeepFace.represent）
   → 不进行数据库比对
   → 直接返回 face_encoding
   ↓
7. 前端接收到人脸特征
   → 存储在 capturedFaceEncoding 变量
   → 显示预览图
   → 进入信息填写步骤
   ↓
8. 用户填写姓名、手机、邮箱
   ↓
9. 点击"完成注册"
   → 提交到 /customer/register API
   → 保存用户信息和人脸特征到数据库
   ↓
10. 注册成功
    → 关闭模态框
    → 调用 resumeDetection()
    → 主页面人脸识别恢复
```

---

## 优势

### ✅ 避免误判
- 注册时不比对数据库，避免因相似度高而误判为已注册用户
- 用户可以顺利完成注册流程

### ✅ 性能优化
- 注册模式下跳过数据库查询和比对，提升速度
- 减少不必要的计算（欧氏距离计算）

### ✅ 用户体验
- 主页面检测暂停，不会干扰注册流程
- 注册过程更专注，不受主页面识别干扰
- 关闭注册后自动恢复，无需手动操作

### ✅ 资源管理
- 避免同时运行两个摄像头的检测任务
- 降低 CPU/GPU 负载

---

## API 变更

### POST /api/v1/customer/detect

#### 新增参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `skip_recognition` | Boolean | 否 | 是否跳过数据库比对<br>- `true`: 只提取特征，不比对（注册模式）<br>- `false` 或不传: 正常识别模式 |

#### 请求示例（注册模式）

```json
{
  "image": "<base64-encoded-image>",
  "skip_recognition": true
}
```

#### 响应示例（注册模式）

```json
{
  "success": true,
  "message": "人脸特征提取成功",
  "data": {
    "face_count": 1,
    "recognized": false,
    "faces": [
      {
        "encoding": [0.123, 0.234, ...],
        "confidence": 0.95
      }
    ]
  }
}
```

---

## 控制台日志

### 进入注册模式
```
📝 进入注册模式，主页面检测已暂停
✋ 人脸检测已暂停
```

### 后端处理
```
🔧 注册模式：跳过数据库比对，直接返回人脸特征
```

### 退出注册模式
```
✅ 退出注册模式，主页面检测已恢复
▶️ 人脸检测已恢复
```

---

## 测试步骤

### 1. 测试暂停/恢复功能

1. 打开主页 `http://127.0.0.1:5000`
2. 观察控制台，应该每2秒有人脸检测日志
3. 点击"立即注册"
4. 观察控制台，检测日志停止
5. 关闭注册模态框
6. 观察控制台，检测日志恢复

### 2. 测试注册不比对

1. 以已注册用户的脸进行新的注册
2. 应该能成功提取特征，不会提示"已注册"
3. 可以继续填写信息（测试环境）

### 3. 测试数据库（生产环境需要额外处理重复注册）

注意：当前实现允许同一人脸多次注册（因为不比对）。如果需要防止重复注册，应该在 `/customer/register` API 中添加检查逻辑。

---

## 未来改进建议

- [ ] 在 `/customer/register` 中添加重复注册检查（可选）
- [ ] 添加注册模式的视觉提示（例如顶部横幅）
- [ ] 优化摄像头切换动画
- [ ] 添加注册进度指示器

---

**更新时间**: 2025-10-20  
**版本**: 1.2
