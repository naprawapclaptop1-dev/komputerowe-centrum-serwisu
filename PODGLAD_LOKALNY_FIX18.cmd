@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo NAUKA OD A DO Z 6.7.0 FIX18 — PODGLAD LOKALNY
echo ============================================================
where node >nul 2>nul
if errorlevel 1 (echo [BLAD] Nie znaleziono Node.js.& pause& exit /b 2)
if not exist "WEB_PUBLISH\index.html" (echo [BLAD] Brak WEB_PUBLISH\index.html.& pause& exit /b 3)
echo Podglad: http://127.0.0.1:8765/
echo Lokalnie; bez publikacji i bez zapisu do produkcyjnego D1.
echo API logowania wymaga wdrozenia funkcji Cloudflare oraz kluczy OAuth.
node scripts\preview-static.js 8765 --open
endlocal
