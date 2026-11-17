@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul 2>&1
title NAUKA OD A DO Z - TESTY FIX167 CMD-ONLY GEMINI
cd /d "%~dp0"
call "%~dp0RESOLVE_NODE_FIX105.cmd"
if errorlevel 1 goto fail
"%NODE_EXE%" "%~dp0scripts\run-tests-fix167.mjs"
set "RESULT=%ERRORLEVEL%"
echo.
echo FIX167 - WYNIK TESTOW: %RESULT%
echo RAPORT: RAPORT_FIX167_TESTY.log
goto finish
:fail
set "RESULT=10"
echo [BLAD] Nie znaleziono Node.js.
:finish
echo.
echo Kod zakonczenia: %RESULT%
if not defined NPA_KEEP_CONSOLE pause >nul
endlocal & exit /b %RESULT%
