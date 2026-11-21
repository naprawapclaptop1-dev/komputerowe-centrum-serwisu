@echo off
setlocal EnableExtensions
title KOMPUTEROWE CENTRUM SERWISU - OPCJONALNY INSTALATOR XP
pushd "%~dp0"
set "DIST=%~dp0dist"
set "LOGDIR=%DIST%\build-logs"
set "LOG=%LOGDIR%\03-xp-installer.log"
set "PAYLOAD=%DIST%\setup-files\KomputeroweCentrumSerwisu.exe"
set "STAMP=%DIST%\setup-files\BUILD_ID.txt"
set "PRODUCT_VERSION="
set "PRODUCT_FIX="
set "FINAL="
set "ISCC5="
if not exist "%LOGDIR%" mkdir "%LOGDIR%"
if not exist "%DIST%\installers" mkdir "%DIST%\installers"
rem Read the active immutable product identity; never pin an old version/FIX in this optional stage.
if not exist "%~dp0VERSION.txt" goto :identity_fail
set /p PRODUCT_VERSION=<"%~dp0VERSION.txt"
for /f "usebackq skip=1 tokens=1" %%F in ("%~dp0VERSION.txt") do if not defined PRODUCT_FIX set "PRODUCT_FIX=%%F"
if not defined PRODUCT_VERSION goto :identity_fail
if not defined PRODUCT_FIX goto :identity_fail
echo(%PRODUCT_VERSION%| findstr /r /x "[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*" >nul || goto :identity_fail
echo(%PRODUCT_FIX%| findstr /r /x "FIX[0-9][0-9][0-9]" >nul || goto :identity_fail
set "FINAL=%DIST%\installers\KomputeroweCentrumSerwisu_%PRODUCT_FIX%_INSTALATOR_XP.exe"
>"%LOG%" echo KOMPUTEROWE CENTRUM SERWISU %PRODUCT_FIX% - OPTIONAL WINDOWS XP SETUP
>>"%LOG%" echo Date: %DATE% %TIME%

rem XP installer is optional; it still requires a fresh payload matching VERSION.txt.
set "PAYLOAD_OK=0"
if exist "%PAYLOAD%" if exist "%STAMP%" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0VERIFY_PAYLOAD.ps1" -ExePath "%PAYLOAD%" -ExpectedVersion "%PRODUCT_VERSION%" -ExpectedFix "%PRODUCT_FIX%" -StampPath "%STAMP%" -SourceRoot "%~dp0." -CheckStamp >>"%LOG%" 2>&1
  if not errorlevel 1 set "PAYLOAD_OK=1"
)
if "%PAYLOAD_OK%"=="0" (
  >>"%LOG%" echo [INFO] No current verified %PRODUCT_FIX% payload. Rebuilding Portable first.
  call "%~dp0BUILD_PORTABLE.cmd" /nopause >>"%LOG%" 2>&1
  if errorlevel 1 goto :fail
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0VERIFY_PAYLOAD.ps1" -ExePath "%PAYLOAD%" -ExpectedVersion "%PRODUCT_VERSION%" -ExpectedFix "%PRODUCT_FIX%" -StampPath "%STAMP%" -SourceRoot "%~dp0." -CheckStamp >>"%LOG%" 2>&1
if errorlevel 1 goto :fail
for %%F in (SETUP_LEGACY_XP.iss NaprawaPC.ico InstallerWizard.bmp InstallerSmall.bmp CentrumMigracjiHero.png) do if not exist "%~dp0%%F" (>>"%LOG%" echo [FAIL] Missing installer asset %%F.& goto :fail)
if defined INNO5_ISCC if exist "%INNO5_ISCC%" set "ISCC5=%INNO5_ISCC%"
if not defined ISCC5 if exist "%ProgramFiles(x86)%\Inno Setup 5\ISCC.exe" set "ISCC5=%ProgramFiles(x86)%\Inno Setup 5\ISCC.exe"
if not defined ISCC5 if exist "%ProgramFiles%\Inno Setup 5\ISCC.exe" set "ISCC5=%ProgramFiles%\Inno Setup 5\ISCC.exe"
if not defined ISCC5 (
  >>"%LOG%" echo [SKIP] Inno Setup 5.6.1 not installed. XP installer is optional and does not fail BUILD ALL.
  >"%LOGDIR%\XP_INSTALLER.status" echo SKIPPED
  type "%LOG%"
  echo [SKIP] XP installer skipped. This is not a build failure.
  if /i not "%~1"=="/nopause" pause
  popd
  exit /b 0
)
set "TEMP_OUT=%DIST%\build-temp\xp"
if not exist "%TEMP_OUT%" mkdir "%TEMP_OUT%"
if exist "%TEMP_OUT%\KomputeroweCentrumSerwisu_%PRODUCT_FIX%_INSTALATOR_XP.exe" del /q "%TEMP_OUT%\KomputeroweCentrumSerwisu_%PRODUCT_FIX%_INSTALATOR_XP.exe" >nul 2>&1
>>"%LOG%" echo [INFO] Compiler: %ISCC5%
"%ISCC5%" /O"%TEMP_OUT%" "%~dp0SETUP_LEGACY_XP.iss" >>"%LOG%" 2>&1
if errorlevel 1 goto :fail
if not exist "%TEMP_OUT%\KomputeroweCentrumSerwisu_%PRODUCT_FIX%_INSTALATOR_XP.exe" (>>"%LOG%" echo [FAIL] Inno Setup 5 did not create the XP installer.& goto :fail)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0VERIFY_PAYLOAD.ps1" -ExePath "%TEMP_OUT%\KomputeroweCentrumSerwisu_%PRODUCT_FIX%_INSTALATOR_XP.exe" -ExpectedVersion "%PRODUCT_VERSION%" >>"%LOG%" 2>&1
if errorlevel 1 goto :fail
move /y "%TEMP_OUT%\KomputeroweCentrumSerwisu_%PRODUCT_FIX%_INSTALATOR_XP.exe" "%FINAL%" >nul
if errorlevel 1 goto :fail
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0VERIFY_PAYLOAD.ps1" -ExePath "%FINAL%" -ExpectedVersion "%PRODUCT_VERSION%" >>"%LOG%" 2>&1
if errorlevel 1 goto :fail
>>"%LOG%" echo [PASS] XP Setup created and version-verified: %FINAL%
>"%LOGDIR%\XP_INSTALLER.status" echo PASS
type "%LOG%"
echo [PASS] OPCJONALNY INSTALATOR XP COMPLETED.
if /i not "%~1"=="/nopause" pause
popd
exit /b 0
:fail
>>"%LOG%" echo [WARN] Optional XP installer failed. Modern setup and Portable are not deleted.
>"%LOGDIR%\XP_INSTALLER.status" echo FAIL
type "%LOG%"
echo [WARN] XP setup did not build. This optional stage does not block modern build outputs.
if /i not "%~1"=="/nopause" pause
popd
exit /b 1

:identity_fail
>>"%LOG%" echo [FAIL] VERSION.txt does not contain a valid product version and FIX identity.
>"%LOGDIR%\XP_INSTALLER.status" echo FAIL
echo [FAIL] XP installer identity could not be resolved from VERSION.txt.
if /i not "%~1"=="/nopause" pause
popd
exit /b 1
