@echo off
setlocal EnableExtensions
title KOMPUTEROWE CENTRUM SERWISU FIX141 - ZWERYFIKOWANY NOWOCZESNY INSTALATOR
pushd "%~dp0"
set "DIST=%~dp0dist"
set "LOGDIR=%DIST%\build-logs"
set "LOG=%LOGDIR%\02-modern-installer.log"
set "PAYLOAD=%DIST%\setup-files\KomputeroweCentrumSerwisu.exe"
set "STAMP=%DIST%\setup-files\BUILD_ID.txt"
set "FINAL=%DIST%\installers\KomputeroweCentrumSerwisu_FIX141_INSTALATOR.exe"
set "FINALSTAMP=%DIST%\installers\SETUP_BUILD_ID.txt"
set "ISCC="
if not exist "%LOGDIR%" mkdir "%LOGDIR%"
if not exist "%DIST%\installers" mkdir "%DIST%\installers"
if exist "%FINALSTAMP%" del /q "%FINALSTAMP%" >nul 2>&1
if exist "%LOGDIR%\MODERN_INSTALLER.status" del /q "%LOGDIR%\MODERN_INSTALLER.status" >nul 2>&1
>"%LOG%" echo KOMPUTEROWE CENTRUM SERWISU FIX141 - ZWERYFIKOWANY NOWOCZESNY INSTALATOR
>>"%LOG%" echo Date: %DATE% %TIME%

rem Rebuild if the payload is missing OR if its build stamp/version/hash is stale.
set "PAYLOAD_OK=0"
if exist "%PAYLOAD%" if exist "%STAMP%" (
  rem A stale version is expected after a source update. Keep the rejection silent here;
  rem the next branch rebuilds from source and the final verification is logged in full.
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0VERIFY_PAYLOAD.ps1" -ExePath "%PAYLOAD%" -ExpectedVersion "1.0.0.76" -StampPath "%STAMP%" -SourceRoot "%~dp0." -CheckStamp >nul 2>&1
  if not errorlevel 1 set "PAYLOAD_OK=1"
)
if "%PAYLOAD_OK%"=="0" (
  >>"%LOG%" echo [INFO] Existing staged EXE is old or unverified. It will not be packaged.
  >>"%LOG%" echo [INFO] Rebuilding a fresh FIX141 payload from source before installer compile.
  call "%~dp0BUILD_PORTABLE.cmd" /nopause >>"%LOG%" 2>&1
  if errorlevel 1 goto :fail
)
if not exist "%PAYLOAD%" (>>"%LOG%" echo [FAIL] Application payload missing after fresh Portable build.& goto :fail)
if not exist "%STAMP%" (>>"%LOG%" echo [FAIL] BUILD_ID missing. Refusing to package an unverified executable.& goto :fail)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0VERIFY_PAYLOAD.ps1" -ExePath "%PAYLOAD%" -ExpectedVersion "1.0.0.76" -StampPath "%STAMP%" -SourceRoot "%~dp0." -CheckStamp >>"%LOG%" 2>&1
if errorlevel 1 goto :fail
for %%F in (SETUP_MODERN.iss NaprawaPC.ico InstallerWizard.bmp InstallerSmall.bmp CentrumMigracjiHero.png) do if not exist "%~dp0%%F" (>>"%LOG%" echo [FAIL] Missing installer asset %%F.& goto :fail)
if not exist "%DIST%\setup-files\CentrumMigracjiHero.png" (>>"%LOG%" echo [FAIL] Staged hero image missing.& goto :fail)
if defined INNO_MODERN_ISCC if exist "%INNO_MODERN_ISCC%" set "ISCC=%INNO_MODERN_ISCC%"
if not defined ISCC if exist "%ProgramFiles%\Inno Setup 7\ISCC.exe" set "ISCC=%ProgramFiles%\Inno Setup 7\ISCC.exe"
if not defined ISCC if exist "%ProgramFiles(x86)%\Inno Setup 7\ISCC.exe" set "ISCC=%ProgramFiles(x86)%\Inno Setup 7\ISCC.exe"
if not defined ISCC if exist "%ProgramFiles%\Inno Setup 6\ISCC.exe" set "ISCC=%ProgramFiles%\Inno Setup 6\ISCC.exe"
if not defined ISCC if exist "%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe" set "ISCC=%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe"
if not defined ISCC if exist "%LOCALAPPDATA%\Programs\Inno Setup 7\ISCC.exe" set "ISCC=%LOCALAPPDATA%\Programs\Inno Setup 7\ISCC.exe"
if not defined ISCC if exist "%LOCALAPPDATA%\Programs\Inno Setup 6\ISCC.exe" set "ISCC=%LOCALAPPDATA%\Programs\Inno Setup 6\ISCC.exe"
if not defined ISCC (>>"%LOG%" echo [FAIL] Inno Setup 6/7 ISCC.exe not found. Portable remains available.& goto :fail)
set "TEMP_OUT=%DIST%\build-temp\modern"
if not exist "%TEMP_OUT%" mkdir "%TEMP_OUT%"
if exist "%TEMP_OUT%\KomputeroweCentrumSerwisu_FIX141_INSTALATOR.exe" del /q "%TEMP_OUT%\KomputeroweCentrumSerwisu_FIX141_INSTALATOR.exe" >nul 2>&1
>>"%LOG%" echo [INFO] Compiler: %ISCC%
>>"%LOG%" echo [INFO] Installer will embed the freshly verified FIX141 EXE (FileVersion 1.0.0.76).
"%ISCC%" /O"%TEMP_OUT%" "%~dp0SETUP_MODERN.iss" >>"%LOG%" 2>&1
if errorlevel 1 goto :fail
if not exist "%TEMP_OUT%\KomputeroweCentrumSerwisu_FIX141_INSTALATOR.exe" (>>"%LOG%" echo [FAIL] Expected Setup output missing.& goto :fail)
if defined KCS_CODE_SIGNING_THUMBPRINT (
  set "SIGNTOOL="
  if defined KCS_SIGNTOOL_PATH if exist "%KCS_SIGNTOOL_PATH%" set "SIGNTOOL=%KCS_SIGNTOOL_PATH%"
  if not defined SIGNTOOL for %%S in (signtool.exe) do set "SIGNTOOL=%%~$PATH:S"
  if not defined SIGNTOOL (>>"%LOG%" echo [FAIL] KCS_CODE_SIGNING_THUMBPRINT is set, but signtool.exe was not found.& goto :fail)
  >>"%LOG%" echo [INFO] Signing installer with certificate thumbprint from Windows certificate store.
  "%SIGNTOOL%" sign /sha1 "%KCS_CODE_SIGNING_THUMBPRINT%" /fd SHA256 /tr http://timestamp.digicert.com /td SHA256 "%TEMP_OUT%\KomputeroweCentrumSerwisu_FIX141_INSTALATOR.exe" >>"%LOG%" 2>&1
  if errorlevel 1 goto :fail
  "%SIGNTOOL%" verify /pa /v "%TEMP_OUT%\KomputeroweCentrumSerwisu_FIX141_INSTALATOR.exe" >>"%LOG%" 2>&1
  if errorlevel 1 goto :fail
  >>"%LOG%" echo [PASS] Authenticode signature verified before BUILD_ID creation.
) else (
  >>"%LOG%" echo [WARN] No KCS_CODE_SIGNING_THUMBPRINT configured. Installer remains unsigned; SHA-256 manifest validation will be used.
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0VERIFY_PAYLOAD.ps1" -ExePath "%TEMP_OUT%\KomputeroweCentrumSerwisu_FIX141_INSTALATOR.exe" -ExpectedVersion "1.0.0.76" -StampPath "%TEMP_OUT%\SETUP_BUILD_ID.txt" -SourceRoot "%~dp0." -CreateStamp >>"%LOG%" 2>&1
if errorlevel 1 goto :fail
move /y "%TEMP_OUT%\KomputeroweCentrumSerwisu_FIX141_INSTALATOR.exe" "%FINAL%" >nul
if errorlevel 1 goto :fail
move /y "%TEMP_OUT%\SETUP_BUILD_ID.txt" "%FINALSTAMP%" >nul
if errorlevel 1 goto :fail
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0VERIFY_PAYLOAD.ps1" -ExePath "%FINAL%" -ExpectedVersion "1.0.0.76" -StampPath "%FINALSTAMP%" -SourceRoot "%~dp0." -CheckStamp >>"%LOG%" 2>&1
if errorlevel 1 goto :fail
>"%LOGDIR%\MODERN_INSTALLER.status" echo PASS
>>"%LOG%" echo [PASS] FIX141 modern installer created, version-verified and source-bound: %FINAL%
for %%F in ("%FINAL%") do >>"%LOG%" echo [FILE] %%~zF bytes
if exist "%LOG%" type "%LOG%"
echo.
echo [PASS] FIX141 MODERN INSTALLER COMPLETED.
if /i not "%~1"=="/nopause" pause
popd
exit /b 0
:fail
>>"%LOG%" echo [FAIL] Nie utworzono nowoczesnego instalatora. Stale payloads are rejected; previous release artifacts are not marked as FIX141.
>"%LOGDIR%\MODERN_INSTALLER.status" echo FAIL
if exist "%LOG%" type "%LOG%"
echo.
echo [FAIL] FIX141 MODERN INSTALLER NOT BUILT. See log. Old Setup output is not certified as FIX141.
if /i not "%~1"=="/nopause" pause
popd
exit /b 1
