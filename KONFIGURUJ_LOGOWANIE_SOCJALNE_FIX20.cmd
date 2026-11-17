@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul 2>&1
cd /d "%~dp0"
title NAUKA OD A DO Z - KONFIGURACJA LOGOWANIA FIX19B

echo ======================================================
echo NAUKA OD A DO Z - KONFIGURACJA LOGOWANIA FIX19B
echo ======================================================
echo.
where.exe node >nul 2>&1
if errorlevel 1 goto no_node
if not exist "%CD%\TOOLS_CLOUDFLARE\node_modules\wrangler\bin\wrangler.js" (
  echo [INFO] Brak lokalnego Wrangler. Przygotowuje przypieta wersje 4.156.0...
  call "%CD%\PRZYGOTUJ_WRANGLER_FIX18.cmd"
  if errorlevel 1 goto failed
)
echo [OK] Wrangler jest gotowy. Uruchamiam bezpieczny konfigurator lokalny.
echo Konfigurator nie publikuje strony i nie uruchamia migracji D1.
echo.
node scripts\configure-oauth-secrets.js
if errorlevel 1 goto failed
echo.
echo [OK] Zakonczono konfiguracje. Aktywacja wymaga kolejnej publikacji Pages.
pause
endlocal
exit /b 0

:no_node
echo [BLAD] Brak Node.js w PATH.
echo Zainstaluj Node.js 24, zamknij okno i uruchom ponownie.
pause
endlocal
exit /b 10

:failed
echo.
echo [BLAD] Konfiguracja nie zostala zakonczona. Sekrety nie zostaly zapisane w plikach projektu.
pause
endlocal
exit /b 1
