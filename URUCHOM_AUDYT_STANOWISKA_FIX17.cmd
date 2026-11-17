@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo AUDYT STANOWISKA FIX17 — TRYB ODCZYTU
echo ============================================================
where powershell.exe >nul 2>nul
if errorlevel 1 (echo [BLAD] Brak Windows PowerShell.& pause& exit /b 2)
if not exist "AUDYT_STANOWISKA_FIX17.ps1" (echo [BLAD] Brak AUDYT_STANOWISKA_FIX17.ps1.& pause& exit /b 3)
powershell.exe -NoProfile -File "%~dp0AUDYT_STANOWISKA_FIX17.ps1"
endlocal
