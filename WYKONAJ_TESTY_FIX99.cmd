@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
echo ======================================================
echo NAUKA OD A DO Z - TESTY REGRESJI FIX99
echo ======================================================
call "%~dp0RESOLVE_NODE_FIX101.cmd"
if errorlevel 1 (
  echo [BLAD] Nie wykryto dzialajacego Node.js.
  pause
  exit /b 10
)
echo [OK] Node.js wykryty: %NODE_VERSION%
"%NODE_EXE%" scripts\run-tests-fix99.mjs
set "RC=%ERRORLEVEL%"
echo.
if "%RC%"=="0" (
  echo [OK] Wszystkie testy FIX99 przeszly.
) else (
  echo [BLAD] Testy FIX99 nie przeszly. Publikacja pozostaje zablokowana.
)
echo Kod zakonczenia: %RC%
pause
exit /b %RC%
