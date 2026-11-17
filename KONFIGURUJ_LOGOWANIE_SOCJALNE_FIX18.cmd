@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul 2>&1
title NAUKA OD A DO Z - KONFIGURACJA LOGOWANIA OAUTH
cd /d "%~dp0"
echo ======================================================
echo NAUKA OD A DO Z FIX18 - KONFIGURACJA GOOGLE / FACEBOOK
echo MICROSOFT / X / GITHUB / DISCORD
echo ======================================================
where.exe node >nul 2>&1
if errorlevel 1 (echo [BLAD] Nie znaleziono Node.js w PATH.& goto failed)
if not exist "TOOLS_CLOUDFLARE\node_modules\wrangler\bin\wrangler.js" (
  echo [INFO] Przygotowuje brakujacy lokalny Wrangler...
  call "%CD%\PRZYGOTUJ_WRANGLER_FIX18.cmd" /quiet
  if errorlevel 1 goto failed
)
if not exist "scripts\configure-oauth-secrets.js" (echo [BLAD] Brak lokalnego konfiguratora OAuth.& goto failed)
node "scripts\configure-oauth-secrets.js"
if errorlevel 1 goto failed
echo.
echo [OK] Konfigurator zakonczony. Sekrety zapisano jako zaszyfrowane Secrets Cloudflare.
echo Nie uruchomiono publikacji ani migracji D1. Uruchom URUCHOM_AKADEMIE.cmd po sprawdzeniu callbackow.
goto finish
:failed
echo.
echo [BLAD] Konfiguracja nie zostala zakonczona. Nie wykonano publikacji.
:finish
echo.
pause
endlocal
