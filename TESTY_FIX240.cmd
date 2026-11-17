@echo off
setlocal
cd /d "%~dp0"
echo NAUKA OD A DO Z - TESTY FIX240
node scripts\run-tests-fix240.mjs
set "RC=%ERRORLEVEL%"
echo.
echo Kod zakonczenia: %RC%
pause
exit /b %RC%
