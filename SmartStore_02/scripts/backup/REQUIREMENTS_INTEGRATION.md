# 依赖文件整合说明

## 📅 整合时间
2025年10月21日

## 🎯 整合目标
将原有的三个混乱的依赖文件整合成一个清晰、完整的 `requirements.txt` 文件。

## 📋 原有文件问题

### 1. requirements.txt (原版)
- **版本**: 较旧的版本配置
- **问题**: 
  - TensorFlow 2.15.0 (过时)
  - NumPy 1.24.3 (版本限制过严)
  - 包含过多注释和冲突说明
  - 依赖版本不统一

### 2. requirements_current.txt
- **版本**: 从实际环境导出
- **问题**: 
  - 包含 224 个依赖（过多）
  - 包含开发工具依赖（Jupyter、Streamlit等）
  - 包含数据分析依赖（xgboost、lightgbm等）
  - 不适合生产环境

### 3. requirements_minimal.txt
- **版本**: 精简版
- **问题**: 
  - 版本与 current 一致但注释不够详细
  - 缺少部分可选依赖的说明

## ✅ 整合后的新版本

### 新 requirements.txt 特点

1. **版本统一**: 使用最新稳定版本
   - TensorFlow 2.20.0
   - NumPy 2.2.6
   - Flask 3.0.3
   - OpenCV 4.12.0.88

2. **依赖精简**: 仅保留项目运行必需的核心依赖
   - Web 框架: Flask + Cors
   - 深度学习: TensorFlow + PyTorch (GPU)
   - 计算机视觉: OpenCV + Pillow
   - 人脸识别: DeepFace
   - 数据库: PyMySQL + SQLAlchemy
   - 语音: SpeechRecognition + edge-tts
   - LLM: OpenAI

3. **分类清晰**: 按功能模块分组
   - Web 框架
   - 深度学习框架
   - 计算机视觉
   - 目标检测
   - 人脸识别
   - 数据库
   - 语音识别与合成
   - LLM 与 NLP
   - 配置与工具

4. **注释完善**: 
   - 安装说明清晰
   - PyTorch GPU 版本单独安装说明
   - DeepFace 模型下载提示
   - 可选依赖标注

5. **可维护性强**: 
   - 移除开发工具依赖
   - 移除数据分析依赖
   - 注释掉可选依赖
   - 便于后续升级

## 📦 核心依赖统计

| 类别 | 数量 | 说明 |
|------|------|------|
| Web 框架 | 8 | Flask 生态系统 |
| 深度学习 | 3 | TensorFlow + Keras |
| 计算机视觉 | 3 | OpenCV + Pillow + NumPy |
| 目标检测 | 1 | Ultralytics YOLO |
| 人脸识别 | 1 | DeepFace |
| 数据库 | 3 | PyMySQL + SQLAlchemy |
| 语音 | 2 | SpeechRecognition + edge-tts |
| LLM | 1 | OpenAI API |
| 数据处理 | 2 | Pandas + NumPy |
| 工具库 | 6 | dotenv, pydantic, requests 等 |
| **总计** | **30** | 精简高效 |

对比：
- 原 requirements.txt: ~100 行代码，70+ 依赖
- requirements_current.txt: 224 依赖
- **新 requirements.txt**: ~100 行代码，**30 核心依赖** ✨

## 📂 文件位置

```
SmartStore_02/
├── requirements.txt              # ✅ 新的整合版本（使用这个）
└── scripts/
    └── backup/                   # 旧版本备份
        ├── requirements_current.txt
        └── requirements_minimal.txt
```

## 🚀 使用方法

### 快速安装（推荐）

```powershell
# 1. 创建虚拟环境
conda create -n smart_store python=3.10 -y
conda activate smart_store

# 2. 安装 PyTorch GPU 版本
pip install torch==2.7.1 torchvision==0.22.1 --index-url https://download.pytorch.org/whl/cu118

# 3. 安装其他依赖
pip install -r requirements.txt
```

### 生产环境部署

```powershell
# 使用相同的命令，确保环境一致性
pip install -r requirements.txt
```

## 🔧 版本升级说明

### 主要版本变更

| 包名 | 旧版本 | 新版本 | 说明 |
|------|--------|--------|------|
| TensorFlow | 2.15.0 | 2.20.0 | 性能提升 |
| NumPy | 1.24.3 | 2.2.6 | 支持最新特性 |
| Flask | 3.0.0 | 3.0.3 | 安全更新 |
| OpenCV | 4.8.1 | 4.12.0 | 新功能 |
| Ultralytics | 8.0.196 | 8.3.203 | 更好的 YOLO 支持 |
| PyMySQL | 1.1.0 | 1.1.1 | Bug 修复 |
| SQLAlchemy | 2.0.23 | 2.0.30 | 性能优化 |
| OpenAI | 1.3.7 | 1.12.0 | 新 API 支持 |

### 兼容性

- ✅ Python 3.10+
- ✅ CUDA 11.8
- ✅ Windows / Linux / macOS
- ✅ 向后兼容现有代码

## 📝 移除的依赖

以下依赖已从新版本中移除（因为项目中未使用）：

### 开发工具
- Jupyter 相关 (notebook, ipykernel, ipywidgets)
- Streamlit
- Bokeh, Holoviews 等可视化工具

### 机器学习
- xgboost, lightgbm, catboost (集成学习)
- optuna, shap (模型优化)
- imbalanced-learn

### 数据分析
- seaborn, plotly (高级可视化)
- gensim, nltk (高级 NLP)

### 其他
- opencv-contrib-python (包含非自由算法)
- diffusers, safetensors (文生图)
- transformers (本地 LLM - 已注释，可选)
- 各种音频处理库 (pydub, soundfile - 已注释，可选)

这些依赖可以在需要时单独安装。

## 🔄 迁移步骤

如果你使用的是旧版本依赖文件，建议按以下步骤迁移：

### 1. 备份当前环境
```powershell
conda list --export > my_environment_backup.txt
```

### 2. 创建新环境
```powershell
conda create -n smart_store_new python=3.10 -y
conda activate smart_store_new
```

### 3. 安装新依赖
```powershell
pip install torch==2.7.1 torchvision==0.22.1 --index-url https://download.pytorch.org/whl/cu118
pip install -r requirements.txt
```

### 4. 测试项目
```powershell
python run.py
```

### 5. 确认无误后删除旧环境
```powershell
conda remove -n smart_store --all
conda rename smart_store_new smart_store
```

## ⚠️ 注意事项

1. **PyTorch GPU**: 必须使用指定的安装命令，不要通过 requirements.txt 安装
2. **DeepFace 模型**: 首次运行会自动下载约 700MB 的模型文件
3. **数据库**: 确保 MySQL 服务已启动
4. **环境变量**: 配置 `.env` 文件

## 🎉 整合成果

- ✅ 依赖数量从 224 减少到 30 (87% 减少)
- ✅ 版本全部更新到最新稳定版
- ✅ 注释清晰，易于维护
- ✅ 分类合理，结构清晰
- ✅ 移除冗余，精简高效
- ✅ 保留备份，安全可靠

---

**整合完成！现在项目使用统一、清晰的 requirements.txt 文件。** 🎊
