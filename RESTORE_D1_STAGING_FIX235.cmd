@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
set /p FILE=Sciezka do pliku kopii SQL: 
set /p DBNAME=Dokladna nazwa pustej bazy staging/test/dev: 
set /p CONFIG=Pelna sciezka do wrangler.toml z bindingiem tej bazy: 
if "%FILE%"=="" goto :bad
if "%DBNAME%"=="" goto :bad
if "%CONFIG%"=="" goto :bad
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "tools\FIX235_RESTORE_D1_STAGING_ONLY.ps1" -BackupFile "%FILE%" -TargetDatabase "%DBNAME%" -ConfigPath "%CONFIG%" -ConfirmRestore
set RC=%ERRORLEVEL%
echo Kod zakonczenia: %RC%
pause
exit /b %RC%
:bad
echo [BLAD] Brakuje wymaganych danych.
pause
exit /b 2
