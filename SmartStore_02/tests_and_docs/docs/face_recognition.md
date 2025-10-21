# 人脸识别模块文档（Face Recognition）

本文档覆盖 SmartStore 项目中人脸识别模块的实现细节、前后端交互、模型配置、数据存储、GPU 使用、性能、以及常见故障排查。

---

## 1. 概述

人脸识别模块用于在无人商店场景中识别顾客身份并支持自动结算、会员验证等功能。本项目使用 DeepFace 作为高层接口，底层采用 TensorFlow（默认）或其它可选后端。

主要职责：
- 检测图片中人脸位置
- 对人脸进行编码（Embedding）
- 在本地或数据库中比对编码以识别用户
- 提供注册接口将人脸编码与用户信息绑定
- 保存用户的人脸图片（可选）

---

## 2. 架构与组件

- 前端（Web UI / 摄像头）
  - 将拍摄的图片或视频帧按需求发送到后端
  - 管理后台可以批量查看/管理用户的人脸数据

- 后端（Flask API）
  - 提供 `/api/v1/customer/detect` 和 `/api/v1/customer/register` 等接口
  - 使用 `core_modules/customer_detection/identification/face_recognition.py` 中的 `FaceRecognizer` 封装 DeepFace 的调用
  - `member_verify.py` 负责从数据库加载已注册的人脸并实现用户验证逻辑

- 数据库（MySQL）
  - `users` 表含 `face_encoding` 字段（TEXT）保存编码（JSON 或逗号分隔字符串）
  - 可选：保存人脸图片到 `data_layer/storage/face_database` 目录

- 模型
  - 默认模型：Facenet（DeepFace）
  - 可选模型：VGG-Face, ArcFace, Dlib 等

---

## 3. 接口与数据流

### 3.1 /api/v1/customer/detect (POST)

- 功能：上传一张图片，返回检测到的人脸数量、是否识别为已注册用户、和匹配用户信息
- 请求 body (JSON)：
```json
{ "image": "<base64-encoded-image>" }
```
- 响应（识别成功）：
```json
{
  "success": true,
  "message": "欢迎回来，张三！",
  "data": {
    "face_count": 1,
    "recognized": true,
    "user": { "id": 1, "name": "张三", ... },
    "distance": 3.21
  }
}
```
- 响应（检测到新顾客）：
```json
{
  "success": true,
  "message": "检测到新顾客",
  "data": {
    "face_count": 1,
    "recognized": false,
    "faces": [{ "encoding": [...], "confidence": 0.95 }]
  }
}
```

### 3.2 /api/v1/customer/register (POST)

- 功能：注册新顾客并将人脸编码保存到数据库
- 请求 body (JSON)：
```json
{
  "name": "张三",
  "phone": "13800000000",
  "email": "zhangsan@example.com",
  "face_encoding": [0.123, 0.234, ...]
}
```
- 响应（成功）：
```json
{ "success": true, "message": "注册成功", "data": { "id": 42 } }
```

---

## 4. 实现技术细节

### 4.1 DeepFace 调用

- `DeepFace.extract_faces(img_path=..., detector_backend='opencv', enforce_detection=False)` 用于检测人脸位置和置信度
- `DeepFace.represent(img_path=..., model_name='Facenet', enforce_detection=False)` 用于生成人脸 embedding

注意：`img_path` 在此处传入的是 numpy 数组（RGB/BGR）而不是文件路径，DeepFace 支持这种用法。

### 4.2 编码存储与比对

- 存储方式：在数据库 `users.face_encoding` 字段中以 JSON 数组或逗号分隔字符串保存编码
- 比对方式：计算欧氏距离（L2）
  - 代码中对比逻辑为：
    - 遍历已注册用户 embedding
    - 计算 np.linalg.norm(embedding1 - embedding2)
    - 找到最小距离，若小于阈值（Facenet 使用 10.0），则认为匹配

### 4.3 阈值说明
- 原始阈值 0.6（来自部分库的默认值）并不适用于所有模型
- 对于 Facenet（DeepFace）在本项目中使用经调整为 **10.0**，能够更好地匹配已注册用户

### 4.4 GPU 加速
- 项目中 PyTorch 可用 GPU（已安装 cu118 版本），但 TensorFlow 当前为 CPU 版
- DeepFace 默认使用 TensorFlow 后端，因此**当前人脸识别运行在 CPU 上**
- 如需 GPU 加速：安装 TensorFlow GPU 版本（例如 `tensorflow[and-cuda]==2.20.0`）或切换 DeepFace 后端到 PyTorch（需额外配置）

---

## 5. 前端实现示例

### 5.1 使用 JavaScript 发送 base64 图像

```javascript
// 将 <input type=file> 读取并上传
function sendFaceImage(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const base64 = reader.result.split(',')[1];
    fetch('/api/v1/customer/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64 })
    }).then(r => r.json()).then(data => console.log(data));
  };
  reader.readAsDataURL(file);
}
```

### 5.2 cURL 示例

```bash
curl -X POST http://localhost:5000/api/v1/customer/detect \
  -H "Content-Type: application/json" \
  -d '{"image":"<BASE64_IMAGE>"}'
```

---

## 6. 后端代码注意点

- `FaceRecognizer`: 负责检测/编码/加载/保存已知人脸
- `MemberVerifier`: 负责从数据库加载人脸编码，提供 `verify_by_face`、`register_member_face` 等方法
- `main_app.py` 中的 `customer_detect`、`customer_register` 为 API 入口
- `startup_config.init_app()` 会在应用启动时调用 `init_database()` 与 `init_models()`，确保数据库表与模型初始化

---

## 7. 性能与容量考虑

- 单张图片的检测与编码在 CPU 上可能需要 300-800ms
- 并发识别需要限制并发数或采用队列（Celery / Redis）
- 大规模部署建议：
  - 使用 GPU 加速
  - 将 embedding 存入向量数据库（FAISS、Milvus）以提高比对性能

---

## 8. 常见问题与排查

- 无法识别已注册用户：
  - 检查 `face_encoding` 是否正确保存（JSON 格式）
  - 检查阈值（建议 10.0）
  - 检查模型是否相同（训练或版本差异会影响 embedding）

- DeepFace 抛错或模型下载失败：
  - 首次运行会自动下载模型，请保证网络通畅
  - 检查磁盘空间，模型体积较大

- 想提高匹配速度与准确率：
  - 使用更好的摄像头，确保光照均匀
  - 使用 GPU，提高编码速度
  - 使用向量索引库替代线性遍历

---

## 9. 下一步建议

- 安装 TensorFlow GPU 版本并验证 DeepFace 是否开始使用 GPU
- 将 face_encoding 存为 JSON（已实现，但确保所有写入代码使用 json.dumps）
- 在 `tests_and_docs` 中新增测试用例，验证人脸注册与识别流程

---

文档撰写完毕。
