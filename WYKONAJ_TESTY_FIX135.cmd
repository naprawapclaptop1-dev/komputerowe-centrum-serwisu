@echo off
setlocal
cd /d "%~dp0"
echo ======================================================
echo NAUKA OD A DO Z 6.8.0 - TESTY FIX135
echo ======================================================
set "NODE_EXE="
if exist "NODE_EXE.path" set /p NODE_EXE=<"NODE_EXE.path"
if defined NODE_EXE if exist "%NODE_EXE%" goto run_tests
set "NODE_EXE=node"
:run_tests
"%NODE_EXE%" scripts\run-tests-fix135.mjs
set "RC=%ERRORLEVEL%"
echo.
if "%RC%"=="0" (echo [PASS] FIX135) else (echo [FAIL] FIX135 - KOD %RC%)
echo.
pause
exit /b %RC%
