@echo off
chcp 65001 > nul
title Mo Cong Ket Noi Crawler Ra Internet (Cloudflare Tunnel)
echo ========================================================
echo   DANG KHOI TAO DUONG TRUYEN PUBLIC CHO CRAWLER...
echo ========================================================
echo.
echo Hay copy duong link https://xxxx.trycloudflare.com ben duoi
echo va dan vao bien CRAWLER_URL tren Vercel!
echo.
"%~dp0cloudflared.exe" tunnel --url http://127.0.0.1:11235
pause
