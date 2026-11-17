@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo NAUKA OD A DO Z 6.8.0 — PELNA REGRESJA FIX186
echo ============================================================
where node >nul 2>nul
if errorlevel 1 (
  echo [BLAD] Brak Node.js w PATH.
  pause
  exit /b 2
)
node scripts\run-tests-fix186.mjs
set "RESULT=%ERRORLEVEL%"
if not "%RESULT%"=="0" (
  echo [FAIL] Testy FIX186 nie przeszly. Nie publikuj tej paczki.
) else (
  echo [PASS] Regresja FIX176-FIX186 zakonczona pomyslnie.
)
echo Log: FIX186_FULL_TESTS.log
pause
exit /b %RESULT%
