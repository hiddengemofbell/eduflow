@echo off
title EduFlow App Launcher
echo Starting EduFlow System...

:: Start Express Backend Server silently
start /b node "%~dp0server\server.js" > NUL 2>&1

:: Start Vite Dev Server silently
start /b npm --prefix "%~dp0client" run dev > NUL 2>&1

:: Wait 2 seconds then launch EduFlow in default browser / PWA app window
timeout /t 2 /nobreak > NUL
start http://localhost:5050/
