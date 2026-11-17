@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
echo ======================================================
echo NAUKA OD A DO Z - DLA WSZYSTKICH - TESTY FIX123
echo Globalna blokada fotografii osob, lokalne ilustracje techniczne
echo Kontrola marki, PWA, OneClick, Watcher i symulatorow
echo ======================================================
node scripts\run-tests-fix123.mjs
set "RC=%ERRORLEVEL%"
echo.
echo Kod zakonczenia: %RC%
echo Raport: RAPORT_FIX123_TESTY.log
echo.
pause
exit /b %RC%
