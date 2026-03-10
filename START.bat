@echo off
echo.
echo  ScreenForge — Starting...
echo.
cd /d "%~dp0server"
call npm install
echo.
echo  Open http://localhost:3002 in your browser
echo.
node index.js
pause
