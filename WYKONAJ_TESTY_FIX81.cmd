@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NAUKA OD A DO Z - TESTY FIX81
color 0B
echo ======================================================
echo NAUKA OD A DO Z - GLOBAL ACADEMY PRO
echo TEST PUBLIKACJI CLOUDFLARE PAGES DIRECT UPLOAD - FIX81
echo ======================================================
where node >nul 2>nul
if errorlevel 1 (
  echo [BLAD] Node.js nie jest dostepny w PATH.
  pause
  exit /b 1
)
node --version
node scripts\run-tests-fix81.mjs
set RESULT=%ERRORLEVEL%
echo.
if not "%RESULT%"=="0" (
  echo [BLAD] Testy FIX81 nie przeszly. Publikacja pozostaje zablokowana.
) else (
  echo [OK] Wszystkie testy FIX81 zakonczone pomyslnie.
  echo [INFO] OneClick opublikuje Direct Upload do produkcji bez flagi --branch.
)
echo ======================================================
pause
exit /b %RESULT%
