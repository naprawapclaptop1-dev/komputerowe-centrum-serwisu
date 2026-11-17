@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
echo NAUKA OD A DO Z — WERYFIKACJA IZOLACJI HYPER-V FIX207
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\FIX207_VERIFY_HYPERV_ISOLATION.ps1"
set "RC=%ERRORLEVEL%"
echo Kod: %RC%
pause
exit /b %RC%
