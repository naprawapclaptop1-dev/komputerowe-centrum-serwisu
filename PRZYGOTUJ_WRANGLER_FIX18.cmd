@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul 2>&1
cd /d "%~dp0"
set "WRANGLER_JS=%CD%\TOOLS_CLOUDFLARE\node_modules\wrangler\bin\wrangler.js"
rem Legacy FIX101 resolver retained for older helpers: RESOLVE_NODE_FIX101.cmd.
call "%CD%\RESOLVE_NODE_FIX105.cmd"
if errorlevel 1 goto :no_node

if exist "%WRANGLER_JS%" goto :verify
set "NPM_CLI=%NODE_DIR%node_modules\npm\bin\npm-cli.js"
if exist "%NPM_CLI%" goto :npm_ready
where.exe npm >nul 2>&1
if errorlevel 1 goto :no_npm
:npm_ready

if /i not "%~1"=="/quiet" (
  echo ======================================================
  echo NAUKA OD A DO Z FIX18 - PRZYGOTOWANIE CLOUDFLARE WRANGLER
  echo ======================================================
  echo Nie znaleziono lokalnego Wrangler.
  echo Zainstaluje przypieta wersje 4.156.0 z oficjalnego rejestru npm.
  echo Instalacja wymaga polaczenia z Internetem.
  echo Nie uruchamiam publikacji ani migracji D1.
  echo.
)
if not exist "TOOLS_CLOUDFLARE" mkdir "TOOLS_CLOUDFLARE"
if errorlevel 1 goto :install_failed
if exist "%NPM_CLI%" (
  "%NODE_EXE%" "%NPM_CLI%" install --prefix "%CD%\TOOLS_CLOUDFLARE" --no-save --no-package-lock --no-audit --no-fund wrangler@4.156.0
) else (
  call npm.cmd install --prefix "%CD%\TOOLS_CLOUDFLARE" --no-save --no-package-lock --no-audit --no-fund wrangler@4.156.0
)
if errorlevel 1 goto :install_failed
if not exist "%WRANGLER_JS%" goto :install_failed

:verify
"%NODE_EXE%" "%WRANGLER_JS%" --version
if errorlevel 1 goto :verify_failed
if /i not "%~1"=="/quiet" echo [OK] Lokalny Wrangler jest gotowy. Nie wykonano publikacji ani migracji.
exit /b 0

:no_node
echo [BLAD] Nie wykryto dzialajacego Node.js. Sprawdzono PATH, rejestr i typowe katalogi instalacji.
exit /b 10
:no_npm
echo [BLAD] Brak npm. Napraw instalacje Node.js/npm i uruchom ponownie.
exit /b 11
:install_failed
echo [BLAD] Nie udalo sie pobrac Wrangler 4.156.0. Sprawdz Internet, npm i uprawnienia do folderu.
exit /b 12
:verify_failed
echo [BLAD] Zainstalowany Wrangler nie uruchamia sie poprawnie.
exit /b 13
