# 更新日志

所有重要的项目变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [2.0.0] - 2025-10-19

### ✨ 新增
- 完整的管理后台系统
  - 仪表盘（实时统计）
  - 商品管理（CRUD）
  - 用户管理（查询、充值）
  - 交易记录（历史查询）
  - 库存管理（预警、补货）
  - 系统设置（参数配置）
- 统一的数据库初始化脚本 `init_database.py`
  - 自动创建数据库
  - 自动创建所有表
  - 自动添加测试数据（21 种商品 + 30 条交易）
- 精简的项目文档
  - 整合所有说明到 README.md
  - 删除冗余文档文件
- Windows 启动脚本 `start.bat`

### 🔧 优化
- 人脸识别阈值从 0.6 调整至 10.0（更符合 Facenet 模型）
- `face_encoding` 字段类型从 VARCHAR(2048) 改为 TEXT
- 数据库连接采用懒加载模式
- 详细的日志输出（识别距离、匹配结果）

### 🐛 修复
- 修复人脸识别无法匹配已注册用户的问题
- 修复 DeepFace 模块找不到的问题（环境路径错误）
- 修复 face_encoding 字段长度不足导致注册失败
- 修复模块导入路径问题
- 修复 Transaction 模型字段名不一致问题

### 🗑️ 删除
- 删除 loguru 依赖，改用 Python 标准 logging
- 删除冗余文档（QUICK_START.md, INSTALL_GUIDE.md 等）
- 删除旧的测试脚本（test_env.py, check_database.py 等）
- 删除 start.ps1（保留 start.bat）

---

## [1.0.0] - 2025-10-15

### ✨ 初始版本
- 项目框架搭建
- 基础人脸识别功能（DeepFace + Facenet）
- 数据库设计（5 张核心表）
- Flask 应用架构
- 前端页面框架
- 语音交互模块框架
- 购物篮管理框架

---

**图例**：
- ✨ 新增
- 🔧 优化
- 🐛 修复
- 🗑️ 删除
- 📝 文档
- 🔒 安全
