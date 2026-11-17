@echo off
setlocal
cd /d "%~dp0"
echo NAUKA OD A DO Z 6.8.0 - TESTY FIX210-FIX218
node scripts\run-tests-fix210-218.mjs
set "RC=%ERRORLEVEL%"
echo.
echo Kod wyniku: %RC%
pause
exit /b %RC%
