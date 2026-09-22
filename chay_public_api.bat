@echo off
chcp 65001 > nul
title Chia Se 9Router API Ra Ngoai Internet (Cloudflare Tunnel)
echo ========================================================
echo   DANG KHOI TAO DUONG TRUYEN PUBLIC CHO 9ROUTER...
echo ========================================================
echo.
"%~dp0cloudflared.exe" tunnel --url http://localhost:20128
pause
