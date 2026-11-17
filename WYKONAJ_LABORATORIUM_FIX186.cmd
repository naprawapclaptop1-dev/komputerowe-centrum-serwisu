@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo AKADEMIA FIX186 — KOLEKTOR DANYCH DIAGNOSTYCZNYCH
echo ============================================================
if not exist "%~dp0tools\FIX186_COLLECTOR.ps1" (
  echo [BLAD] Brak tools\FIX186_COLLECTOR.ps1.
  pause
  exit /b 2
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\FIX186_COLLECTOR.ps1"
if errorlevel 1 echo [UWAGA] Kolektor zakonczyl sie kodem %errorlevel%.
endlocal
