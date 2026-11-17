@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul 2>&1
cd /d "%~dp0"
title NAUKA OD A DO Z - TESTY FIX163 GEMINI
call "%~dp0RESOLVE_NODE_FIX105.cmd"
if errorlevel 1 goto no_node
"%NODE_EXE%" "%~dp0scripts\run-tests-fix163.mjs"
set "RESULT=%ERRORLEVEL%"
echo.
echo ======================================================
echo FIX163 - WYNIK TESTOW GEMINI / CMD / ZAKRES KOMPUTEROWY: %RESULT%
echo RAPORT: RAPORT_FIX163_TESTY.log
echo ======================================================
if not defined NPA_KEEP_CONSOLE pause >nul
endlocal & exit /b %RESULT%
:no_node
echo [BLAD] Nie znaleziono Node.js.
if not defined NPA_KEEP_CONSOLE pause >nul
endlocal & exit /b 10
