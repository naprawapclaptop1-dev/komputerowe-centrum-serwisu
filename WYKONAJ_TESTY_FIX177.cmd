@echo off
setlocal
cd /d "%~dp0"
echo ======================================================
echo NAUKA OD A DO Z - TESTY FIX177
echo ======================================================
call RESOLVE_NODE_FIX105.cmd
if errorlevel 1 (echo [BLAD] Nie znaleziono prawidlowego Node.js.& pause & exit /b 10)
"%NODE_EXE%" scripts\run-tests-fix177.mjs > FIX177_FULL_TESTS.log 2>&1
set "RC=%ERRORLEVEL%"
type FIX177_FULL_TESTS.log
echo.
if "%RC%"=="0" (echo [OK] STATUS: PASS) else (echo [BLAD] STATUS: FAIL)
echo Raport: FIX177_FULL_TESTS.log
pause
exit /b %RC%
