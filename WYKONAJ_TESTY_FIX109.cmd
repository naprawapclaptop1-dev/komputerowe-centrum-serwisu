@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul 2>&1
for %%I in ("%~dp0.") do set "NPA_ROOT=%%~fI"
cd /d "%NPA_ROOT%"
title NAUKA OD A DO Z - TESTY FIX109
 echo ======================================================
echo NAUKA OD A DO Z - TESTY FIX109
echo ======================================================
call "%NPA_ROOT%\RESOLVE_NODE_FIX105.cmd"
set "NODE_RC=%ERRORLEVEL%"
if not "%NODE_RC%"=="0" goto :NO_NODE
echo [OK] Node.js: %NODE_VERSION%
echo.
"%NODE_EXE%" "%NPA_ROOT%\scripts\run-tests-fix109.mjs"
set "TEST_RC=%ERRORLEVEL%"
echo.
if "%TEST_RC%"=="0" (echo [OK] Testy FIX109 zaliczone.) else (echo [BLAD] Testy FIX109 nie przeszly.)
echo Kod zakonczenia: %TEST_RC%
echo.
echo Nacisnij dowolny klawisz, aby zamknac.
pause >nul
endlocal & exit /b %TEST_RC%
:NO_NODE
echo [BLAD] Nie mozna uruchomic testow bez resolvera Node FIX105.
echo Nacisnij dowolny klawisz, aby zamknac.
pause
endlocal & exit /b 10
