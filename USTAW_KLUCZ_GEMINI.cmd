@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul 2>&1
title NAUKA OD A DO Z - USTAWIANIE KLUCZA GEMINI
cd /d "%~dp0"
set "ROOT=%CD%"
call "%ROOT%\RESOLVE_NODE_FIX105.cmd"
if errorlevel 1 goto no_node
if not exist "%ROOT%\TOOLS_CLOUDFLARE\node_modules\wrangler\bin\wrangler.js" (
  echo [INFO] Przygotowuje lokalny Wrangler...
  call "%ROOT%\PRZYGOTUJ_WRANGLER_FIX18.cmd" /quiet
  if errorlevel 1 goto no_wrangler
)
if not exist "%ROOT%\scripts\configure-gemini-secret.js" goto no_script
if not exist "%ROOT%\scripts\configure-gemini-secret.ps1" goto no_script
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\configure-gemini-secret.ps1" -NodeExe "%NODE_EXE%" -Force
set "RESULT=%ERRORLEVEL%"
goto finish
:no_node
echo [BLAD] Nie znaleziono Node.js.
set "RESULT=10"
goto finish
:no_wrangler
echo [BLAD] Nie mozna przygotowac lokalnego Wrangler.
set "RESULT=11"
goto finish
:no_script
echo [BLAD] Brak scripts\configure-gemini-secret.js.
set "RESULT=12"
:finish
echo.
echo Kod zakonczenia: %RESULT%
if not defined NPA_KEEP_CONSOLE pause >nul
endlocal & exit /b %RESULT%
