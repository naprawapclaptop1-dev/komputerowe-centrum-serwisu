@echo off
setlocal
cd /d "%~dp0"
title NAUKA OD A DO Z - TESTY FIX220-FIX228
if not exist "scripts\run-tests-fix220-228.mjs" (
  echo [BLAD] Brak runnera testow FIX220-FIX228.
  pause
  exit /b 2
)
node "scripts\run-tests-fix220-228.mjs"
set "RESULT=%ERRORLEVEL%"
echo.
echo ======================================================
echo NAUKA OD A DO Z - TESTY FIX220-FIX228
if "%RESULT%"=="0" (echo WYNIK: PASS) else (echo WYNIK: BLAD %RESULT%)
echo ======================================================
pause
exit /b %RESULT%
