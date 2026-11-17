@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
echo ======================================================
echo NAUKA OD A DO Z - DLA WSZYSTKICH - TESTY FIX124
echo Naprawa filmu wsparcia FIX9: H.264/AAC, 1280x720, SHA-256
echo Kontrola OneClick, Watcher, PWA i zachowania danych D1
echo ======================================================
node scripts\run-tests-fix124.mjs
set "RC=%ERRORLEVEL%"
echo.
echo Kod zakonczenia: %RC%
echo Raport: RAPORT_FIX124_TESTY.log
echo.
pause
exit /b %RC%
