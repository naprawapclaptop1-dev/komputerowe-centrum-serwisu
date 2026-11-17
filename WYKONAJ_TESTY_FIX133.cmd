@echo off
setlocal
cd /d "%~dp0"
echo ======================================================
echo NAUKA OD A DO Z 6.8.0 - TESTY FIX133
echo ======================================================
node scripts\run-tests-fix133.mjs
set "RC=%ERRORLEVEL%"
echo.
if "%RC%"=="0" (echo [PASS] FIX133) else (echo [FAIL] FIX133 - KOD %RC%)
echo.
pause
exit /b %RC%
