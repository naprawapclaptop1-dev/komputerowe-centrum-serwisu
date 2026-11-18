@echo off
rem FIX101: one persistent visible CMD host; worker is a separate batch file.
setlocal EnableExtensions DisableDelayedExpansion
set "KCS_WORKER=%~dp0KCS_FIX101_WORKER.cmd"
if not exist "%KCS_WORKER%" (
  echo [BLAD] Brak pliku roboczego: "%KCS_WORKER%"
  echo Rozpakuj ponownie kompletne archiwum FIX101.
  pause
  exit /b 2
)
start "KOMPUTEROWE CENTRUM SERWISU - FIX104" "%ComSpec%" /d /k ""%KCS_WORKER%""
if errorlevel 1 (
  echo [BLAD] Nie mozna uruchomic stalego okna CMD.
  pause
  exit /b 3
)
exit /b 0
