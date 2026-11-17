@echo off
rem Independent FIX95 regression runner. Historical compatibility path: WYKONAJ_TESTY_FIX47.cmd (FIX46).
setlocal
cd /d "%~dp0"
chcp 65001 >nul
where node >nul 2>nul
if errorlevel 1 (
  echo [BLAD] Nie znaleziono Node.js w PATH.
  pause
  exit /b 2
)
echo ==============================================
echo NAUKA OD A DO Z — PELNE TESTY FIX95
echo ==============================================
node scripts\run-tests-fix95.mjs
set "RC=%ERRORLEVEL%"
echo.
if not "%RC%"=="0" (
  echo [BLAD] Testy nie przeszly. Publikacja pozostaje zablokowana.
) else (
  echo [OK] Wszystkie testy FIX95 zakonczone powodzeniem.
)
echo Kod zakonczenia: %RC%
pause
exit /b %RC%
