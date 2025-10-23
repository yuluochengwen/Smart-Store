#!/usr/bin/env python3
"""
智能购物系统测试脚本
用于验证系统功能和完整性
"""

import os
import sys
import json
import subprocess
from pathlib import Path

def check_python_version():
    """检查Python版本"""
    print("🔍 检查Python版本...")
    version = sys.version_info
    if version >= (3, 6):
        print(f"✅ Python {version.major}.{version.minor}.{version.micro} 版本符合要求")
        return True
    else:
        print(f"❌ Python版本过低，需要3.6+，当前版本: {version.major}.{version.minor}")
        return False

def check_dependencies():
    """检查依赖包"""
    print("\n🔍 检查依赖包...")
    
    required_packages = [
        'flask',
        'flask_cors',
        'numpy',
        'opencv_python'
    ]
    
    # 正确的导入名称映射（pip 包名 -> import 名称）
    import_name_map = {
        'opencv_python': 'cv2',
        'flask_cors': 'flask_cors'
    }
    
    missing_packages = []
    
    for package in required_packages:
        try:
            import_name = import_name_map.get(package, package)
            __import__(import_name)
            print(f"✅ {package} 已安装")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package} 未安装")
    
    if missing_packages:
        print(f"\n⚠️  发现 {len(missing_packages)} 个缺失的包:")
        for package in missing_packages:
            print(f"   - {package}")
        print(f"\n💡 安装命令: pip install {' '.join(missing_packages)}")
        return False
    
    print("✅ 所有依赖包检查通过")
    return True

def check_file_structure():
    """检查文件结构"""
    print("\n🔍 检查文件结构...")
    
    required_files = [
        'backend/app.py',
        'backend/run.py',
        'backend/config.py',
        'backend/requirements.txt',
        'frontend/client/index.html',
        'frontend/client/styles.css',
        'frontend/client/script.js',
        'frontend/admin/login.html',
        'frontend/admin/dashboard.html',
        'frontend/admin/styles.css',
        'frontend/admin/script.js',
        'README.md',
        'start.sh'
    ]
    
    missing_files = []
    
    for file_path in required_files:
        if Path(file_path).exists():
            print(f"✅ {file_path} 存在")
        else:
            missing_files.append(file_path)
            print(f"❌ {file_path} 不存在")
    
    if missing_files:
        print(f"\n⚠️  发现 {len(missing_files)} 个缺失的文件:")
        for file_path in missing_files:
            print(f"   - {file_path}")
        return False
    
    print("✅ 文件结构检查通过")
    return True

def check_database_schema():
    """检查数据库模式"""
    print("\n🔍 检查数据库模式...")
    
    try:
        # 尝试导入数据库模块
        sys.path.append('backend')
        from utils.database import db_manager
        
        # 检查数据库连接
        result = db_manager.execute_query("SELECT 1")
        if result:
            print("✅ 数据库连接正常")
            return True
        else:
            print("❌ 数据库连接失败")
            return False
            
    except Exception as e:
        print(f"❌ 数据库检查失败: {e}")
        return False

def check_ai_system():
    """检查AI系统"""
    print("\n🔍 检查AI系统...")
    
    try:
        sys.path.append('backend')
        from utils.ai_detection import init_ai_system
        
        if init_ai_system():
            print("✅ AI系统初始化成功")
            return True
        else:
            print("❌ AI系统初始化失败")
            return False
            
    except Exception as e:
        print(f"⚠️  AI系统检查失败: {e}")
        print("💡 这是可选功能，不影响核心系统运行")
        return True

def check_camera_system():
    """检查摄像头系统"""
    print("\n🔍 检查摄像头系统...")
    
    try:
        sys.path.append('backend')
        from utils.camera import init_camera_system
        
        if init_camera_system():
            print("✅ 摄像头系统初始化成功")
            return True
        else:
            print("⚠️  摄像头系统初始化失败")
            print("💡 请检查摄像头设备是否连接")
            return False
            
    except Exception as e:
        print(f"⚠️  摄像头系统检查失败: {e}")
        print("💡 这是可选功能，不影响核心系统运行")
        return True

def test_flask_app():
    """测试Flask应用"""
    print("\n🔍 测试Flask应用...")
    
    try:
        sys.path.append('backend')
        from app import app
        
        # 测试应用创建
        with app.app_context():
            print("✅ Flask应用创建成功")
            
            # 测试路由
            test_routes = ['/', '/client', '/admin/login']
            for route in test_routes:
                try:
                    client = app.test_client()
                    response = client.get(route)
                    if response.status_code in [200, 302]:
                        print(f"✅ 路由 {route} 正常")
                    else:
                        print(f"⚠️  路由 {route} 状态码: {response.status_code}")
                except Exception as e:
                    print(f"❌ 路由 {route} 测试失败: {e}")
            
            return True
            
    except Exception as e:
        print(f"❌ Flask应用测试失败: {e}")
        return False

def generate_test_report(results):
    """生成测试报告"""
    print("\n" + "="*60)
    print("📋 智能购物系统测试报告")
    print("="*60)
    
    total_tests = len(results)
    passed_tests = sum(1 for result in results.values() if result)
    failed_tests = total_tests - passed_tests
    
    print(f"\n📊 测试结果统计:")
    print(f"   总测试数: {total_tests}")
    print(f"   通过测试: {passed_tests}")
    print(f"   失败测试: {failed_tests}")
    print(f"   通过率: {passed_tests/total_tests*100:.1f}%")
    
    print(f"\n📋 详细测试结果:")
    for test_name, result in results.items():
        status = "✅ 通过" if result else "❌ 失败"
        print(f"   {test_name}: {status}")
    
    if failed_tests == 0:
        print(f"\n🎉 恭喜！所有测试都通过了！")
        print(f"🚀 系统已准备好启动！")
        print(f"\n💡 下一步:")
        print(f"   1. 运行 ./start.sh 启动系统")
        print(f"   2. 访问 http://localhost:5000/client 体验客户端")
        print(f"   3. 访问 http://localhost:5000/admin 进入管理后台")
    else:
        print(f"\n⚠️  发现 {failed_tests} 个问题需要修复")
        print(f"💡 请根据上面的错误提示进行修复")
        print(f"🔧 修复完成后重新运行测试脚本")
    
    print("\n" + "="*60)

def main():
    """主测试函数"""
    print("🚀 智能购物系统测试工具")
    print("="*60)
    
    # 运行测试
    results = {}
    
    print("\n🧪 开始系统测试...")
    
    # 测试项目
    test_functions = [
        ("Python版本检查", check_python_version),
        ("依赖包检查", check_dependencies),
        ("文件结构检查", check_file_structure),
        ("数据库模式检查", check_database_schema),
        ("AI系统检查", check_ai_system),
        ("摄像头系统检查", check_camera_system),
        ("Flask应用测试", test_flask_app)
    ]
    
    for test_name, test_func in test_functions:
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"❌ {test_name} 执行失败: {e}")
            results[test_name] = False
    
    # 生成测试报告
    generate_test_report(results)
    
    # 返回测试结果
    return all(results.values())

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)