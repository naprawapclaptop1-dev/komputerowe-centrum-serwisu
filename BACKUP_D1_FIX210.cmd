@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
echo ======================================================
echo NAUKA OD A DO Z - KOPIA D1 PRZED MIGRACJA FIX210
echo ======================================================
set /p DBNAME=Podaj dokladna nazwe ISTNIEJACEJ bazy D1: 
if "%DBNAME%"=="" (echo [BLAD] Nie podano nazwy bazy.& pause & exit /b 2)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "tools\FIX210_BACKUP_D1_BEFORE_MIGRATION.ps1" -DatabaseName "%DBNAME%"
set RC=%ERRORLEVEL%
echo Kod zakonczenia: %RC%
pause
exit /b %RC%
