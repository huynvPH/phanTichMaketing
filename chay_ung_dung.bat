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

echo Dang khoi chay Server & Giao dien tai http://localhost:5173...
echo Hay giu cua so nay mo trong khi su dung app.
echo.

start http://localhost:5173
npm run dev
pause
