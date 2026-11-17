@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
echo ======================================================
echo NAUKA OD A DO Z - DLA WSZYSTKICH - TESTY FIX126
echo ======================================================
node scripts\run-tests-fix126.mjs
set "RC=%ERRORLEVEL%"
echo.
echo Kod zakonczenia: %RC%
echo Raport: RAPORT_FIX126_TESTY.log
echo.
pause
exit /b %RC%
