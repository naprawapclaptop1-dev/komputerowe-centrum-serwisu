@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title NAUKA OD A DO Z - TESTY FIX130
echo ======================================================
echo NAUKA OD A DO Z - DLA WSZYSTKICH - TESTY FIX130
echo ======================================================
node scripts\run-tests-fix130.mjs
set "RESULT=%ERRORLEVEL%"
echo.
echo Kod zakonczenia: %RESULT%
echo Raport: RAPORT_FIX130_TESTY.log
echo.
pause
exit /b %RESULT%
