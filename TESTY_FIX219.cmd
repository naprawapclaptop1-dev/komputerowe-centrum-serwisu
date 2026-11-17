@echo off
setlocal
cd /d "%~dp0"
echo ==============================================
echo NAUKA OD A DO Z - TESTY FIX219
echo ==============================================
node scripts\run-tests-fix219.mjs
set "RC=%ERRORLEVEL%"
echo.
echo Kod zakonczenia: %RC%
pause
exit /b %RC%
