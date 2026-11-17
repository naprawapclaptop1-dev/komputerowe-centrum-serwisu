@echo off
setlocal
cd /d "%~dp0"
node scripts\check-oauth-production.js
if errorlevel 1 (echo. & echo Diagnostyka wykazala problem. & pause & exit /b 1)
pause
endlocal
