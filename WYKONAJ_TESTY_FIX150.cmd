@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo ======================================================
echo NAUKA OD A DO Z 6.8.0 - TESTY PUBLIKATORA FIX150
echo Naprawa zakresu releaseVersion i pelna regresja
echo ======================================================
set "NODE_EXE="
if exist "NODE_EXE.path" (
  for /f "usebackq delims=" %%I in ("NODE_EXE.path") do set "NODE_EXE=%%I"
)
if defined NODE_EXE if exist "%NODE_EXE%" (
  echo [OK] Node: "%NODE_EXE%"
  "%NODE_EXE%" scripts\run-tests-fix137.mjs
) else (
  echo [INFO] Uzywam Node.js z PATH.
  node scripts\run-tests-fix137.mjs
)
set "RC=%ERRORLEVEL%"
echo.
echo ======================================================
if "%RC%"=="0" (echo WYNIK: PASS) else (echo WYNIK: FAIL - KOD %RC%)
echo Raport: RAPORT_FIX150_TESTY.log
echo ======================================================
pause
exit /b %RC%
