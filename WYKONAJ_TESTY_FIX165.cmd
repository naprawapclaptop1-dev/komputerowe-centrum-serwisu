@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul 2>&1
cd /d "%~dp0"
title NAUKA OD A DO Z - TESTY FIX165 - GEMINI V1
call "%~dp0RESOLVE_NODE_FIX105.cmd"
if errorlevel 1 goto no_node
"%NODE_EXE%" "%~dp0scripts\run-tests-fix165.mjs"
set "RESULT=%ERRORLEVEL%"
echo.
echo ======================================================
echo FIX165 - TESTY GEMINI V1 I SZYBKIEJ WALIDACJI KLUCZA: %RESULT%
echo RAPORT: RAPORT_FIX165_TESTY.log
echo ======================================================
if not defined NPA_KEEP_CONSOLE pause >nul
endlocal & exit /b %RESULT%
:no_node
echo [BLAD] Nie znaleziono Node.js.
if not defined NPA_KEEP_CONSOLE pause >nul
endlocal & exit /b 10
