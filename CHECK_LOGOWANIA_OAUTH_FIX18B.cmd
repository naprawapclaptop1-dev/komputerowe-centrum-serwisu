@echo off
setlocal
cd /d "%~dp0"
echo ==============================================
echo NAUKA OD A DO Z - DIAGNOSTYKA LOGOWANIA OAUTH
echo ==============================================
node --version >nul 2>&1
if errorlevel 1 (
  echo [BLAD] Brak Node.js. Zainstaluj Node.js 20 lub nowszy.
  pause
  exit /b 1
)
node "scripts\check-oauth-production.js"
echo.
if errorlevel 1 echo [INFO] Przeczytaj przyczyny pokazane powyzej. To tylko odczyt statusu - bez migracji i publikacji.
echo.
pause
endlocal
