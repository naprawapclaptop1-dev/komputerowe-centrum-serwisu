@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title NAUKA OD A DO Z — TESTY FIX241
echo ======================================================
echo NAUKA OD A DO Z — TESTY FIX241
echo ======================================================
node scripts\run-tests-fix241.mjs
set "RESULT=%ERRORLEVEL%"
echo.
echo ======================================================
if "%RESULT%"=="0" (echo WYNIK: PASS) else (echo WYNIK: FAIL — kod %RESULT%)
echo ======================================================
pause
exit /b %RESULT%
