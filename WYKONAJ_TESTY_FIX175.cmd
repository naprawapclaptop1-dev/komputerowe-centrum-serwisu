@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul 2>&1
title NAUKA OD A DO Z - TESTY FIX175 AKADEMIA MISTRZA
cd /d "%~dp0"
call "%~dp0RESOLVE_NODE_FIX105.cmd"
if errorlevel 1 goto fail
"%NODE_EXE%" "%~dp0scripts\run-tests-fix175.mjs"
set "RESULT=%ERRORLEVEL%"
echo.
echo FIX175 - WYNIK TESTOW: %RESULT%
echo RAPORT: RAPORT_FIX175_TESTY.log
goto finish
:fail
set "RESULT=10"
echo [BLAD] Nie znaleziono Node.js.
:finish
echo.
echo Kod zakonczenia: %RESULT%
if not defined NPA_KEEP_CONSOLE pause >nul
endlocal & exit /b %RESULT%
