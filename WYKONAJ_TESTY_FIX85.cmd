@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NAUKA OD A DO Z - TESTY FIX85
color 0B
echo ======================================================
echo NAUKA OD A DO Z - GLOBAL ACADEMY PRO
echo FIX85 - JAWNA PRODUCTION BRANCH CLOUDFLARE PAGES
echo ======================================================
where node >nul 2>nul
if errorlevel 1 (
  echo [BLAD] Node.js nie jest dostepny w PATH.
  pause
  exit /b 1
)
node --version
node scripts\run-tests-fix85.mjs
set RESULT=%ERRORLEVEL%
echo.
if not "%RESULT%"=="0" (
  echo [BLAD] Testy FIX85 nie przeszly. Publikacja pozostaje zablokowana.
) else (
  echo [OK] Testy FIX85 zakonczone pomyslnie.
  echo [INFO] Wrangler dostaje jawnie Production Branch odczytana z Cloudflare.
  echo [INFO] Nie zmieniono bazy D1 ani sekretow.
)
echo ======================================================
pause
exit /b %RESULT%
