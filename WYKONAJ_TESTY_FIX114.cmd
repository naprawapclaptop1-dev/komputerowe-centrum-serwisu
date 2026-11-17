@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul 2>&1
for %%I in ("%~dp0.") do set "NPA_ROOT=%%~fI"
cd /d "%NPA_ROOT%"
title NAUKA OD A DO Z - TESTY FIX114
echo ======================================================
echo NAUKA OD A DO Z - TESTY FIX114
echo Naprawa zakresu release.json w AUTO-PUBLISH-WATCHER
 echo ======================================================
call "%NPA_ROOT%\RESOLVE_NODE_FIX105.cmd"
set "NODE_RC=%ERRORLEVEL%"
if not "%NODE_RC%"=="0" goto :NO_NODE
echo [OK] Node.js: %NODE_VERSION%
echo.
"%NODE_EXE%" "%NPA_ROOT%\scripts\run-tests-fix114.mjs"
set "TEST_RC=%ERRORLEVEL%"
echo.
if "%TEST_RC%"=="0" (echo [OK] Testy FIX114 zaliczone.) else (echo [BLAD] Testy FIX114 nie przeszly.)
echo Kod zakonczenia: %TEST_RC%
echo Raport: RAPORT_FIX114_TESTY.log
echo.
echo Nacisnij dowolny klawisz, aby zamknac.
pause >nul
endlocal & exit /b %TEST_RC%
:NO_NODE
echo [BLAD] Nie mozna uruchomic testow bez resolvera Node FIX105.
echo Nacisnij dowolny klawisz, aby zamknac.
pause
endlocal & exit /b 10
