@echo off
title Marketing AI Hub
echo ========================================================
echo         DANG KHOI DONG MARKETING AI HUB
echo    Ket noi ChatGPT, Claude, Gemini va Notion
echo ========================================================
echo.

REM Kiem tra Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [LOI] May tinh chua cai dat Node.js! Vui long cai Node.js tu https://nodejs.org
    pause
    exit /b
)

REM Kiem tra uv (chay crawler Python)
where uv >nul 2>nul
if %errorlevel% neq 0 (
    echo [LOI] May tinh chua cai dat uv! Vui long cai uv tu https://docs.astral.sh/uv
    pause
    exit /b
)

if not exist crawler\.venv call npm run setup:crawler

echo Dang khoi chay Server & Giao dien tai http://localhost:5173...
echo Hay giu cua so nay mo trong khi su dung app.
echo.

start http://localhost:5173
npm run dev
pause
