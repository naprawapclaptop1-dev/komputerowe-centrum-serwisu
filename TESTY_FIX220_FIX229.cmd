@echo off
setlocal
chcp 65001 >nul
title NAUKA OD A DO Z — TESTY FIX220–FIX229
cd /d "%~dp0"
echo ======================================================
echo NAUKA OD A DO Z — TESTY FIX220–FIX229
echo ======================================================
node scripts/run-tests-fix220-229.mjs
set "RC=%ERRORLEVEL%"
echo.
if "%RC%"=="0" (echo [OK] Wszystkie lokalne testy zakonczone powodzeniem.) else (echo [BLAD] Testy nie przeszly. Kod: %RC%)
echo.
pause
exit /b %RC%
