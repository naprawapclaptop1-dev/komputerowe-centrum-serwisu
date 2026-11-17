@echo off
setlocal
cd /d "%~dp0"
echo ======================================================
echo NAUKA OD A DO Z - TESTY FIX176
echo ======================================================
call RESOLVE_NODE_FIX105.cmd
if errorlevel 1 (echo [BLAD] Nie znaleziono prawidlowego Node.js.& pause & exit /b 10)
"%NODE_EXE%" scripts\run-tests-fix176.mjs
set "RC=%ERRORLEVEL%"
echo.
if "%RC%"=="0" (echo [OK] STATUS: PASS) else (echo [BLAD] STATUS: FAIL)
echo Raport: RAPORT_FIX176_TESTY.log
pause
exit /b %RC%
