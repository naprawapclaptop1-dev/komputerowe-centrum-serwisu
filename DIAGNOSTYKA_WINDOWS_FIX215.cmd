@echo off
chcp 65001 >nul
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "tools\FIX215_WINDOWS_DEEP_DIAGNOSTIC.ps1"
set RC=%ERRORLEVEL%
echo Kod zakonczenia: %RC%
pause
exit /b %RC%
