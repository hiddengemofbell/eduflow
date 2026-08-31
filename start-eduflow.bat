@echo off
title EduFlow Launcher
echo ======================================================
echo           Starting EduFlow Application
echo ======================================================
echo 1. Starting Backend REST API Server (Port 5000)...
start "EduFlow Backend Server" cmd /k "cd /d %~dp0server && npm start"

echo 2. Starting Frontend React Client (Port 3000)...
start "EduFlow Frontend Client" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo ======================================================
echo Both servers are starting up in separate windows!
echo Access EduFlow in your browser at: http://localhost:3000
echo ======================================================
pause
