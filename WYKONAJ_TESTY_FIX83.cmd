@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NAUKA OD A DO Z - TESTY FIX83
color 0B
echo ======================================================
echo NAUKA OD A DO Z - GLOBAL ACADEMY PRO
echo TEST UNIKALNYCH ILUSTRACJI I VRAM FIX83
echo ======================================================
where node >nul 2>nul
if errorlevel 1 (
  echo [BLAD] Node.js nie jest dostepny w PATH.
  pause
  exit /b 1
)
node --version
node scripts\run-tests-fix83.mjs
set RESULT=%ERRORLEVEL%
echo.
if not "%RESULT%"=="0" (
  echo [BLAD] Testy FIX83 nie przeszly. Publikacja pozostaje zablokowana.
) else (
  echo [OK] Testy FIX83 zakonczone pomyslnie.
  echo [INFO] VRAM/GDDR jest osobne od RAM DIMM. Galerie i lekcje maja unikalne grafiki.
)
echo ======================================================
pause
exit /b %RESULT%
