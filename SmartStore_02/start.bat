@echo off
chcp 65001 > nul
REM SmartStore 启动脚本 (Windows)

echo ========================================
echo   SmartStore 智能无人商店
echo ========================================
echo.

echo [1/3] 切换到项目目录...
cd /d "%~dp0"

echo [2/3] 激活 conda 环境...
call E:\Anaconda\Scripts\activate.bat
call conda activate smart_store

echo [3/3] 启动应用...
E:\Anaconda\envs\smart_store\python.exe run.py

pause
