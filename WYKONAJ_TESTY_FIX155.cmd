@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
echo ======================================================
echo NAUKA OD A DO Z - TESTY FIX155 / PELNA REGRESJA
echo ======================================================
where node >nul 2>nul
if errorlevel 1 (
  echo [BLAD] Nie znaleziono Node.js w PATH.
  pause
  exit /b 1
)
node scripts\run-tests-fix155.mjs
set "RESULT=%ERRORLEVEL%"
echo.
echo Kod testow: %RESULT%
echo Raport: RAPORT_FIX155_TESTY.log
echo Nacisnij dowolny klawisz, aby zamknac.
pause >nul
exit /b %RESULT%
