@echo off
setlocal
cd /d "%~dp0"
echo ======================================================
echo NAUKA OD A DO Z - TESTY REGRESYJNE FIX90
 echo ONLINE REAL PHOTO CATALOG + VRAM/RAM GUARD
echo ======================================================
where node >nul 2>nul
if errorlevel 1 (
  echo [BLAD] Node.js nie jest dostepny w PATH.
  pause
  exit /b 1
)
node --version
node scripts\run-tests-fix90.mjs
set "RC=%ERRORLEVEL%"
echo.
if not "%RC%"=="0" echo [BLAD] Testy FIX90 nie przeszly. Publikacja pozostaje zablokowana.
if "%RC%"=="0" echo [OK] Testy FIX90 przeszly.
pause
exit /b %RC%
