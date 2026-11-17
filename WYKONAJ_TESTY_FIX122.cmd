@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
echo ======================================================
echo NAUKA OD A DO Z - TESTY REGRESYJNE FIX122
echo 36 ilustracji technicznych, bez ludzi, OneClick, Watcher, PWA
echo ======================================================
node scripts\run-tests-fix122.mjs
set "RC=%ERRORLEVEL%"
echo.
echo Kod zakonczenia: %RC%
echo Raport: RAPORT_FIX122_TESTY.log
echo.
pause
exit /b %RC%
