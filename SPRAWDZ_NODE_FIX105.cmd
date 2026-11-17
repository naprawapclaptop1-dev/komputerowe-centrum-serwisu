@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul 2>&1
for %%I in ("%~dp0.") do set "NPA_ROOT=%%~fI"
cd /d "%NPA_ROOT%"
title NAUKA OD A DO Z - DIAGNOSTYKA NODE.JS FIX105
echo ======================================================
echo NAUKA OD A DO Z - DIAGNOSTYKA NODE.JS FIX105
echo ======================================================
call "%NPA_ROOT%\RESOLVE_NODE_FIX105.cmd"
set "NODE_RC=%ERRORLEVEL%"
if not "%NODE_RC%"=="0" goto :NO_NODE
echo.
echo [OK] Node.js wykryty i uruchomiony.
echo Plik: "%NODE_EXE%"
echo Wersja: %NODE_VERSION%
echo Katalog: %NODE_DIR%
echo Wyniki zapisano w NODE_EXE.path i NODE_EXE.version.
echo PATH nie byl modyfikowany.
echo.
echo Nacisnij dowolny klawisz, aby zamknac.
pause >nul
endlocal & exit /b 0
:NO_NODE
echo.
echo [BLAD] Resolver FIX105 nie potwierdzil plikow wynikowych.
echo Sciezki wynikowe sa jawnie przekazywane jako pelne sciezki bez koncowego odwrotnego ukosnika.
echo.
echo Nacisnij dowolny klawisz, aby zamknac.
pause
endlocal & exit /b 10
