@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo NAUKA OD A DO Z — PRAWDZIWY ODCZYT SPRZETU WINDOWS FIX198
echo ============================================================
if not exist "%~dp0tools\FIX198_WINDOWS_HARDWARE_COLLECTOR.ps1" (
  echo [BLAD] Brak kolektora FIX198.
  pause
  exit /b 2
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\FIX198_WINDOWS_HARDWARE_COLLECTOR.ps1"
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" echo [BLAD] Kolektor zakonczyl sie kodem %RC%.
echo.
echo Raport JSON mozna zaladowac do Laboratorium FIX186/198.
pause
exit /b %RC%
