@echo off
setlocal
cd /d "%~dp0"
echo ==================================================
echo NAUKA OD A DO Z 6.8.0 - TESTY FIX131
echo ==================================================
where node >nul 2>nul || (echo [BLAD] Brak Node.js w PATH.& pause & exit /b 1)
node scripts\run-tests-fix131.mjs
set "RC=%ERRORLEVEL%"
echo.
if "%RC%"=="0" (echo [PASS] FIX131) else (echo [FAIL] FIX131)
pause
exit /b %RC%
