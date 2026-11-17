@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
echo ======================================================
echo NAUKA OD A DO Z - TESTY REGRESYJNE FIX121
echo Publikator, Watcher, Master Academy i PWA
echo ======================================================
node scripts\run-tests-fix121.mjs
set "RC=%ERRORLEVEL%"
echo.
echo Kod zakonczenia: %RC%
echo Raport: RAPORT_FIX121_TESTY.log
echo.
pause
exit /b %RC%
