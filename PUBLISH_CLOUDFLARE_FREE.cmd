@echo off
setlocal
cd /d "%~dp0"
title KCS - CLOUDFLARE FREE PUBLISH
echo ============================================================
echo KOMPUTEROWE CENTRUM SERWISU - CLOUDFLARE FREE
echo ============================================================
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0PUBLISH_CLOUDFLARE_FREE.ps1" %*
if errorlevel 1 (
  echo.
  echo [FAIL] Publikacja Cloudflare nie powiodla sie.
  pause
  exit /b 1
)
echo.
echo [PASS] Publikacja i kontrola Cloudflare zakonczone.
pause
endlocal
