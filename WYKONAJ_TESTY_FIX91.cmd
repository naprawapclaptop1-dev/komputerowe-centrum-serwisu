@echo off
setlocal
cd /d "%~dp0"
echo ======================================================
echo NAUKA OD A DO Z - TESTY REGRESYJNE FIX91
echo PAGINACJA ZDJEC ONLINE + VRAM/RAM + WZNOWIENIE
 echo ======================================================
where node >nul 2>nul
if errorlevel 1 (
  echo [BLAD] Node.js nie jest dostepny w PATH.
  pause
  exit /b 1
)
node --version
node scripts\run-tests-fix91.mjs
set "RC=%ERRORLEVEL%"
echo.
if not "%RC%"=="0" echo [BLAD] Testy FIX91 nie przeszly. Publikacja pozostaje zablokowana.
if "%RC%"=="0" echo [OK] Testy FIX91 przeszly.
pause
exit /b %RC%
