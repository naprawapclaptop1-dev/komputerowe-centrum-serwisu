@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo NAUKA OD A DO Z 6.4.0 FIX15 — PODGLAD LOKALNY
echo ============================================================
where node >nul 2>nul
if errorlevel 1 (
  echo [BLAD] Nie znaleziono Node.js w PATH.
  pause
  exit /b 2
)
if not exist "WEB_PUBLISH\index.html" (
  echo [BLAD] Brak WEB_PUBLISH\index.html. Rozpakuj cale archiwum.
  pause
  exit /b 3
)
echo Otwieram podglad tylko na tym komputerze: http://127.0.0.1:8765/
echo Ten tryb NIE publikuje strony i NIE laczy sie z produkcyjna baza D1.
echo Logowanie, API Pages Functions i zdalny backend nie beda aktywne.
echo Nacisnij Ctrl+C, aby zakonczyc.
node scripts\preview-static.js 8765 --open
endlocal
