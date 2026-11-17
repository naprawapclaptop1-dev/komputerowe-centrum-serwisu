@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NAUKA OD A DO Z - TESTY FIX86
color 0B
echo ======================================================
echo NAUKA OD A DO Z - GLOBAL ACADEMY PRO
echo FIX86 - CLOUDFLARE DIRECT UPLOAD PRODUCTION
echo ======================================================
where node >nul 2>nul
if errorlevel 1 (
  echo [BLAD] Node.js nie jest dostepny w PATH.
  pause
  exit /b 1
)
node --version
node scripts\run-tests-fix86.mjs
set RESULT=%ERRORLEVEL%
echo.
if not "%RESULT%"=="0" (
  echo [BLAD] Testy FIX86 nie przeszly. Publikacja pozostaje zablokowana.
) else (
  echo [OK] Testy FIX86 zakonczone pomyslnie.
  echo [INFO] Direct Upload production nie uzywa --branch ani --env.
  echo [INFO] Wrangler kieruje upload na domyslna galez produkcyjna projektu.
  echo [INFO] Nie zmieniono bazy D1 ani sekretow.
)
echo ======================================================
pause
exit /b %RESULT%
