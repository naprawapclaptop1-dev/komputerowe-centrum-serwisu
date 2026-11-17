@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul 2>&1
cd /d "%~dp0"
title NAUKA OD A DO Z - DIAGNOSTYKA NODE.JS FIX103
echo ======================================================
echo NAUKA OD A DO Z - DIAGNOSTYKA NODE.JS FIX103
echo ======================================================
rem Historical FIX102 resolver call retained for compatibility: call "%~dp0RESOLVE_NODE_FIX102.cmd"
call "%~dp0RESOLVE_NODE_FIX105.cmd"
set "NODE_RC=%ERRORLEVEL%"
if not "%NODE_RC%"=="0" goto no_node
echo.
echo [OK] Node.js zostal wykryty.
echo Plik: %NODE_EXE%
echo Wersja: %NODE_VERSION%
echo PATH nie byl modyfikowany; skrypty uruchamiaja Node pelna sciezka.
echo.
echo Nacisnij dowolny klawisz, aby zamknac.
pause >nul
endlocal & exit /b 0
:no_node
echo.
echo [BLAD] Node.js nie zostal wykryty ani poprawnie wybrany.
echo Sprawdz, czy wskazany plik to rzeczywisty node.exe i czy uruchamia sie przez --version.
echo.
echo Okno pozostanie otwarte. Nacisnij dowolny klawisz, aby zamknac.
pause
endlocal & exit /b 10
