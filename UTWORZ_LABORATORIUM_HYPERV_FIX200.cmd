@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo NAUKA OD A DO Z — IZOLOWANE LABORATORIUM HYPER-V FIX200
echo ============================================================
if not exist "%~dp0tools\FIX200_CREATE_ISOLATED_HYPERV_VM.ps1" echo [BLAD] Brak skryptu FIX200.&pause&exit /b 2
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\FIX200_CREATE_ISOLATED_HYPERV_VM.ps1"
set "RC=%ERRORLEVEL%"
echo.
echo Kod: %RC%
pause
exit /b %RC%
