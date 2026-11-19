@echo off
setlocal EnableExtensions DisableDelayedExpansion
title KOMPUTEROWE CENTRUM SERWISU FIX113 - WERYFIKACJA WYNIKOW BUDOWANIA
pushd "%~dp0"
set "VERIFY=%~dp0VERIFY_BUILD.ps1"
set "LOGDIR=%~dp0dist\build-logs"
if not exist "%VERIFY%" goto :missing
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%VERIFY%" -Root "%~dp0"
set "RC=%ERRORLEVEL%"
if not exist "%LOGDIR%\04-verification.log" goto :report_missing
echo ============================================================
echo SZCZEGOLOWY RAPORT WERYFIKACJI FIX113
echo ============================================================
type "%LOGDIR%\04-verification.log"
goto :after_report
:report_missing
echo [WARN] Verification report was not created: %LOGDIR%\04-verification.log
if "%RC%"=="0" set "RC=3"
:after_report
if not "%RC%"=="0" goto :failed
echo [PASS] FIX113 verification completed. Full report: %LOGDIR%\04-verification.log
if /i not "%~1"=="/nopause" pause
popd
exit /b 0
:missing
echo [FAIL] Missing verification script: %VERIFY%
set "RC=2"
:failed
echo [FAIL] Output verification returned code %RC%.
echo [INFO] Review %LOGDIR%\04-verification.log for exact checks and errors.
if /i not "%~1"=="/nopause" pause
popd
exit /b %RC%
