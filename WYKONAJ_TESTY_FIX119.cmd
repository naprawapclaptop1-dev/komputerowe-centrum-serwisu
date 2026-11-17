@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul || (echo Brak Node.js w PATH.& pause & exit /b 1)
node scripts\run-tests-fix119.mjs
set "RC=%ERRORLEVEL%"
echo.
if not "%RC%"=="0" echo TESTY FIX119 NIE POWIODLY SIE.
if "%RC%"=="0" echo TESTY FIX119 ZAKONCZONE POPRAWNIE.
pause
exit /b %RC%
