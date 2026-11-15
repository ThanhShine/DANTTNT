@echo off
chcp 65001 > nul
title HE THONG SALES AI - KHOI DONG TOAN BO

echo ============================================================
echo      HE THONG BAN HANG SALES AI - KHOI DONG TOAN BO
echo      React + Node + Python AI + Vision + Ollama
echo ============================================================
echo.

REM ============================================================
REM 0. KIEM TRA OLLAMA
REM ============================================================

echo [0/4] Kiem tra Ollama Local LLM (Port 11434)...

curl -s http://localhost:11434/api/tags > nul 2>&1

if errorlevel 1 (
    echo   [!] Ollama chua chay.
    echo   [!] Dang khoi dong Qwen2.5:3b...

    start "Ollama - Qwen2.5:3b" cmd /k "ollama run qwen2.5:3b"

    timeout /t 5 /nobreak > nul

    echo   [OK] Da khoi dong Ollama.
) else (
    echo   [OK] Ollama dang hoat dong.
)

echo.

REM ============================================================
REM 1. NODE.JS BACKEND
REM ============================================================

echo [1/4] Khoi dong Node.js Backend (Port 5000)...

start "SalesAI - Backend - Port 5000" /D "%~dp0backend" cmd /k "npm run dev"

timeout /t 3 /nobreak > nul

echo   [OK] Backend dang duoc khoi dong.

echo.

REM ============================================================
REM 2. PYTHON AI SERVICE
REM ============================================================

echo [2/4] Khoi dong Python AI Service (Port 8000)...

start "SalesAI - AI Service - Port 8000" /D "%~dp0ai-service" cmd /k "..\.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 3 /nobreak > nul

echo   [OK] AI Service dang duoc khoi dong.

echo.

REM ============================================================
REM 3. PYTHON VISION SERVICE
REM ============================================================

echo [3/4] Khoi dong Python Vision Service (Port 8001)...

start "SalesAI - Vision Service - Port 8001" /D "%~dp0vision-service" cmd /k ".\.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8001"

timeout /t 3 /nobreak > nul

echo   [OK] Vision Service dang duoc khoi dong.

echo.

REM ============================================================
REM 4. REACT FRONTEND
REM ============================================================

echo [4/4] Khoi dong React Frontend (Port 3000)...

start "SalesAI - Frontend - Port 3000" /D "%~dp0frontend" cmd /k "npm run dev"

timeout /t 5 /nobreak > nul

echo   [OK] Frontend dang duoc khoi dong.

echo.

REM ============================================================
REM HOAN TAT
REM ============================================================

echo ============================================================
echo              HE THONG SALES AI
echo ============================================================
echo.
echo   Ollama:          http://localhost:11434
echo   Qwen:            qwen2.5:3b
echo.
echo   Backend:         http://localhost:5000
echo   AI Service:      http://localhost:8000
echo   Vision Service:  http://localhost:8001
echo   Frontend:        http://localhost:3000
echo.
echo ============================================================
echo   CAC DICH VU DA DUOC KHOI DONG!
echo ============================================================
echo.

timeout /t 3 /nobreak > nul

start http://localhost:3000

exit /b