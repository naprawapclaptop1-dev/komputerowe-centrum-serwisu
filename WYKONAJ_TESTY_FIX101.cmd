@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul 2>&1
cd /d "%~dp0"
echo ======================================================
echo NAUKA OD A DO Z - TESTY REGRESJI FIX101
echo ======================================================
call "%~dp0RESOLVE_NODE_FIX101.cmd"
if errorlevel 1 goto no_node
echo [OK] Node.js wykryty: %NODE_VERSION%
"%NODE_EXE%" scripts\run-tests-fix101.mjs
set "RC=%ERRORLEVEL%"
echo.
if "%RC%"=="0" (echo [OK] Wszystkie testy FIX101 przeszly.) else (echo [BLAD] Testy FIX101 nie przeszly. Publikacja pozostaje zablokowana.)
echo Kod zakonczenia: %RC%
pause
exit /b %RC%
:no_node
echo [BLAD] Node.js nie zostal wykryty. Resolver otwiera wybor pliku node.exe lub przyjmuje zapisana sciezke NODE_EXE.path.
pause
exit /b 10
