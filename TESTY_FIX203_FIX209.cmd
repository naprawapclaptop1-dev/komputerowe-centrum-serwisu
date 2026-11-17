@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title NAUKA OD A DO Z - TESTY FIX203-FIX209
 echo ======================================================
 echo NAUKA OD A DO Z 6.8.0 - TESTY FIX203-FIX209
 echo ======================================================
where node >nul 2>nul
if errorlevel 1 (
  echo [BLAD] Nie znaleziono Node.js w PATH.
  pause
  exit /b 1
)
node scripts\run-tests-fix209.mjs
set RESULT=%ERRORLEVEL%
echo.
if not "%RESULT%"=="0" echo [BLAD] Testy nie przeszly. Kod: %RESULT%
if "%RESULT%"=="0" echo [OK] Wszystkie testy lokalne i regresja zakończone powodzeniem.
echo.
pause
exit /b %RESULT%
