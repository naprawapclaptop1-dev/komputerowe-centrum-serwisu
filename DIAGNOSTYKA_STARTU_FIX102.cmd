@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul 2>&1
cd /d "%~dp0"
title NAUKA OD A DO Z - DIAGNOSTYKA STARTU FIX103
echo ======================================================
echo DIAGNOSTYKA STARTU FIX103
echo ======================================================
echo Folder projektu: %~dp0
if exist "%~dp0URUCHOM_AKADEMIE.cmd" (echo [OK] URUCHOM_AKADEMIE.cmd) else (echo [BRAK] URUCHOM_AKADEMIE.cmd)
if exist "%~dp0RESOLVE_NODE_FIX105.cmd" (echo [OK] RESOLVE_NODE_FIX105.cmd) else (echo [BRAK] RESOLVE_NODE_FIX105.cmd)
if exist "%~dp0ONECLICK_AKADEMIA.js" (echo [OK] ONECLICK_AKADEMIA.js) else (echo [BRAK] ONECLICK_AKADEMIA.js)
echo.
rem Historical FIX102 resolver call retained for compatibility: call "%~dp0RESOLVE_NODE_FIX102.cmd"
call "%~dp0RESOLVE_NODE_FIX105.cmd"
set "NODE_RC=%ERRORLEVEL%"
if "%NODE_RC%"=="0" (
 echo [OK] Node.js: %NODE_VERSION%
 echo [OK] Plik: %NODE_EXE%
) else (
 echo [BLAD] Resolver zwrocil kod %NODE_RC%.
)
echo.
echo Nie wykonano publikacji ani zmian D1.
echo Okno pozostanie otwarte. Nacisnij dowolny klawisz, aby zamknac.
pause
endlocal & exit /b %NODE_RC%
