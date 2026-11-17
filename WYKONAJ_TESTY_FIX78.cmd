@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NAUKA OD A DO Z - TESTY FIX78
color 0B
echo ======================================================
echo NAUKA OD A DO Z - GLOBAL ACADEMY PRO
echo TESTY REGRESJI FOTO MANIFESTU - FIX78
echo ======================================================
where node >nul 2>nul
if errorlevel 1 (
  echo [BLAD] Node.js nie jest dostepny w PATH.
  pause
  exit /b 1
)
node --version
node scripts\run-tests-fix78.mjs
set RESULT=%ERRORLEVEL%
echo.
if not "%RESULT%"=="0" (
  echo [BLAD] Testy FIX78 nie przeszly. Publikacja pozostaje zablokowana.
) else (
  echo [OK] Wszystkie testy FIX78 zakonczone pomyslnie.
)
echo ======================================================
pause
exit /b %RESULT%
