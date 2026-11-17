@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo ======================================================
echo NAUKA OD A DO Z - FIX49 ULTIMATE QUALITY CENTER
echo Pelna regresja, kontrola skladni, audyt bezpieczenstwa i migracji
echo ======================================================
call "%~dp0WYKONAJ_TESTY_FIX47.cmd"
set "RESULT=%ERRORLEVEL%"
if not "%RESULT%"=="0" goto :failed
node scripts\security-audit-fix49.mjs || goto :failed
node scripts\migration-audit-fix49.mjs || goto :failed
node scripts\diagnostic-bundle-fix49.mjs || goto :failed
echo.
echo [OK] Testy, audyty FIX49 i pakiet diagnostyczny zakonczone.
exit /b 0
:failed
echo.
echo [BLAD] Kontrola FIX49 nie przeszla. Publikacja nie jest zatwierdzona.
exit /b 1
