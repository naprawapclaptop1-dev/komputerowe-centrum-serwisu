@echo off
setlocal
cd /d "%~dp0"
echo ======================================================
echo NAUKA OD A DO Z 6.8.0 - TESTY FIX134
echo ======================================================
set "NODE_EXE="
if exist "NODE_EXE.path" set /p NODE_EXE=<"NODE_EXE.path"
if defined NODE_EXE if exist "%NODE_EXE%" goto run_tests
set "NODE_EXE=node"
:run_tests
"%NODE_EXE%" scripts\run-tests-fix134.mjs
set "RC=%ERRORLEVEL%"
echo.
if "%RC%"=="0" (echo [PASS] FIX134) else (echo [FAIL] FIX134 - KOD %RC%)
echo.
pause
exit /b %RC%
