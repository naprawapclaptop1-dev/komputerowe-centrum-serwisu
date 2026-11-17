@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NAUKA OD A DO Z - TESTY FIX84
color 0B
echo ======================================================
echo NAUKA OD A DO Z - GLOBAL ACADEMY PRO
echo TEST SHA-256 / NODE CRYPTO FIX84
echo ======================================================
where node >nul 2>nul
if errorlevel 1 (
  echo [BLAD] Node.js nie jest dostepny w PATH.
  pause
  exit /b 1
)
node --version
node scripts\run-tests-fix84.mjs
set RESULT=%ERRORLEVEL%
echo.
if not "%RESULT%"=="0" (
  echo [BLAD] Testy FIX84 nie przeszly. Publikacja pozostaje zablokowana.
) else (
  echo [OK] Testy FIX84 zakonczone pomyslnie.
  echo [INFO] SHA-256 posterow dziala przez jawny modul node:crypto.
)
echo ======================================================
pause
exit /b %RESULT%
