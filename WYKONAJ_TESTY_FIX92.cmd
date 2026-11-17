@echo off
setlocal
cd /d "%~dp0"
echo ======================================================
echo NAUKA OD A DO Z - TESTY REGRESYJNE FIX92
echo ======================================================
where node >nul 2>nul
if errorlevel 1 (
  echo [BLAD] Node.js nie jest dostepny w PATH.
  pause
  exit /b 1
)
node --version
node scripts\run-tests-fix92.mjs
set "RC=%ERRORLEVEL%"
echo.
if not "%RC%"=="0" echo [BLAD] Testy FIX92 nie przeszly. Publikacja pozostaje zablokowana.
if "%RC%"=="0" echo [OK] Wszystkie testy FIX92 przeszly.
pause
exit /b %RC%
