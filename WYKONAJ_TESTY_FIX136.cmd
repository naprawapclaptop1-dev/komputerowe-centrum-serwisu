@echo off
setlocal
cd /d "%~dp0"
echo ============================================================
echo NAUKA OD A DO Z 6.8.0 - FIX136 - TESTY REGRESYJNE
echo ============================================================
where node >nul 2>nul
if errorlevel 1 (
  echo [BLAD] Nie znaleziono Node.js w PATH.
  pause
  exit /b 2
)
node scripts\run-tests-fix136.mjs
set "RC=%ERRORLEVEL%"
echo.
if not "%RC%"=="0" echo [BLAD] Testy nie przeszly. Raport: RAPORT_FIX136_TESTY.log
if "%RC%"=="0" echo [OK] Wszystkie testy FIX136 przeszly. Raport: RAPORT_FIX136_TESTY.log
pause
exit /b %RC%
