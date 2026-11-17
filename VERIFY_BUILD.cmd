@echo off
setlocal EnableExtensions
title KOMPUTEROWE CENTRUM SERWISU FIX069 - WERYFIKACJA WYNIKOW BUDOWANIA
pushd "%~dp0"
set "DIST=%~dp0dist"
set "LOGDIR=%DIST%\build-logs"
set "PORTABLE=%DIST%\portable\KomputeroweCentrumSerwisu_FIX069_PORTABLE.exe"
set "STAGING=%DIST%\setup-files\KomputeroweCentrumSerwisu.exe"
set "STAMP=%DIST%\setup-files\BUILD_ID.txt"
set "SETUP=%DIST%\installers\KomputeroweCentrumSerwisu_FIX069_INSTALATOR.exe"
set "XPSETUP=%DIST%\installers\KomputeroweCentrumSerwisu_FIX069_INSTALATOR_XP.exe"
set "SETUPSTAMP=%DIST%\installers\SETUP_BUILD_ID.txt"
set "FAILED=0"
set "STRICT=1"
if /i "%~1"=="/partial" set "STRICT=0"
if not exist "%LOGDIR%" mkdir "%LOGDIR%"
>"%LOGDIR%\04-verification.log" echo KOMPUTEROWE CENTRUM SERWISU FIX069 - WERYFIKACJA PO BUDOWANIU
>>"%LOGDIR%\04-verification.log" echo Date: %DATE% %TIME%
echo ============================================================
echo KOMPUTEROWE CENTRUM SERWISU FIX069 - VERIFIED BUILD OUTPUTS
echo ============================================================
call :check "%PORTABLE%" "PORTABLE EXE" required
call :check "%STAGING%" "COMMON INSTALLER PAYLOAD" required
call :check "%STAMP%" "FIX069 BUILD ID" required
call :check "%DIST%\portable\portable.mode" "PORTABLE MODE FLAG" required
call :check "%DIST%\portable\NaprawaPC.ico" "PORTABLE ICON" required
call :check "%DIST%\portable\CentrumMigracjiHero.png" "PORTABLE HERO ART" required
call :check "%DIST%\setup-files\CentrumMigracjiHero.png" "INSTALLER HERO ART" required
call :check "%~dp0NaprawaPC.ico" "SOURCE ICON" required
call :check "%~dp0CentrumMigracjiHero.png" "SOURCE HERO ART" required
call :check "%DIST%\setup-files\README.txt" "STAGED README" required
call :check "%DIST%\setup-files\CHANGELOG.txt" "STAGED CHANGELOG" required
if exist "%STAGING%" if exist "%STAMP%" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0VERIFY_PAYLOAD.ps1" -ExePath "%STAGING%" -ExpectedVersion "1.0.0.69" -StampPath "%STAMP%" -SourceRoot "%~dp0." -CheckStamp >>"%LOGDIR%\04-verification.log" 2>&1
  if errorlevel 1 (echo [FAIL] Staging EXE is stale or does not match its BUILD_ID.& set "FAILED=1") else echo [PASS] Staging EXE file version and SHA-256 verified.
)
if exist "%PORTABLE%" if exist "%DIST%\portable\BUILD_ID.txt" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0VERIFY_PAYLOAD.ps1" -ExePath "%PORTABLE%" -ExpectedVersion "1.0.0.69" -StampPath "%DIST%\portable\BUILD_ID.txt" -SourceRoot "%~dp0." -CheckStamp >>"%LOGDIR%\04-verification.log" 2>&1
  if errorlevel 1 (echo [FAIL] Portable EXE is stale or does not match its BUILD_ID.& set "FAILED=1") else echo [PASS] Portable EXE file version and SHA-256 verified.
) else (echo [FAIL] Portable BUILD_ID is missing.& set "FAILED=1")
if exist "%SETUP%" (
  call :check "%SETUP%" "MODERN SETUP EXE" required
  call :check "%SETUPSTAMP%" "MODERN SETUP BUILD ID" required
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0VERIFY_PAYLOAD.ps1" -ExePath "%SETUP%" -ExpectedVersion "1.0.0.69" -StampPath "%SETUPSTAMP%" -SourceRoot "%~dp0." -CheckStamp >>"%LOGDIR%\04-verification.log" 2>&1
  if errorlevel 1 (echo [FAIL] Setup EXE version, SHA-256 or source identity does not match FIX069.& set "FAILED=1") else echo [PASS] Modern Setup FileVersion, SHA-256 and source identity verified.
) else if "%STRICT%"=="1" (echo [FAIL] Modern Setup missing: %SETUP%& set "FAILED=1") else echo [WARN] Modern Setup missing; partial verification mode.
if exist "%XPSETUP%" (
  call :check "%XPSETUP%" "OPTIONAL XP SETUP EXE" optional
) else echo [SKIP] XP installer is optional.
if exist "%LOGDIR%\PORTABLE.status" (echo [INFO] Portable status: & type "%LOGDIR%\PORTABLE.status")
if exist "%LOGDIR%\MODERN_INSTALLER.status" (echo [INFO] Modern status: & type "%LOGDIR%\MODERN_INSTALLER.status")
if exist "%LOGDIR%\XP_INSTALLER.status" (echo [INFO] XP status: & type "%LOGDIR%\XP_INSTALLER.status")
echo.
if "%FAILED%"=="0" (echo [PASS] FIX069 outputs verified.& >>"%LOGDIR%\04-verification.log" echo [PASS] FIX069 outputs verified.) else (echo [FAIL] FIX069 output verification failed.& >>"%LOGDIR%\04-verification.log" echo [FAIL] FIX069 output verification failed.)
if /i not "%~1"=="/nopause" if /i not "%~1"=="/partial" pause
popd
if "%FAILED%"=="0" exit /b 0
exit /b 1
:check
if not exist "%~1" (echo [FAIL] %~2 missing: %~1& >>"%LOGDIR%\04-verification.log" echo [FAIL] %~2 missing: %~1& if /i not "%~3"=="optional" set "FAILED=1"& exit /b 0)
for %%F in ("%~1") do if %%~zF LEQ 0 (echo [FAIL] %~2 empty: %%~fF& >>"%LOGDIR%\04-verification.log" echo [FAIL] %~2 empty: %%~fF& if /i not "%~3"=="optional" set "FAILED=1") else (echo [PASS] %~2 - %%~zF bytes& >>"%LOGDIR%\04-verification.log" echo [PASS] %~2 - %%~zF bytes)
exit /b 0
