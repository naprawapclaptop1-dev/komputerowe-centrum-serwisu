@echo off
setlocal EnableExtensions DisableDelayedExpansion
title KOMPUTEROWE CENTRUM SERWISU FIX114 - WERYFIKACJA WYNIKOW BUDOWANIA
pushd "%~dp0"
set "VERIFY=%~dp0VERIFY_BUILD.ps1"
set "LOGDIR=%~dp0dist\build-logs"
if not exist "%LOGDIR%" md "%LOGDIR%" >nul 2>&1
if exist "%LOGDIR%\04-verification.log" del /q "%LOGDIR%\04-verification.log" >nul 2>&1
if not exist "%VERIFY%" goto :missing
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%VERIFY%"
set "RC=%ERRORLEVEL%"
if not exist "%LOGDIR%\04-verification.log" goto :report_missing
echo ============================================================
echo SZCZEGOLOWY RAPORT WERYFIKACJI FIX114
echo ============================================================
type "%LOGDIR%\04-verification.log"
goto :after_report
:report_missing
if "%RC%"=="0" set "RC=3"
> "%LOGDIR%\04-verification.log" echo [FAIL] Verification report was not created by VERIFY_BUILD.ps1.
>>"%LOGDIR%\04-verification.log" echo Verifier exit code: %RC%
type "%LOGDIR%\04-verification.log"
goto :after_report
:after_report
if not "%RC%"=="0" goto :failed
echo [PASS] FIX114 verification completed. Full report: %LOGDIR%\04-verification.log
if /i not "%~1"=="/nopause" pause
popd
exit /b 0
:missing
echo [FAIL] Missing verification script: %VERIFY%
set "RC=2"
> "%LOGDIR%\04-verification.log" echo [FAIL] Missing verification script: %VERIFY%
>>"%LOGDIR%\04-verification.log" echo Verifier exit code: %RC%
type "%LOGDIR%\04-verification.log"
:failed
echo [FAIL] Output verification returned code %RC%.
echo [INFO] Review %LOGDIR%\04-verification.log for exact checks and errors.
if /i not "%~1"=="/nopause" pause
popd
exit /b %RC%
