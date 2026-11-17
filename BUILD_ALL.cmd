@echo off
setlocal EnableExtensions EnableDelayedExpansion
title KOMPUTEROWE CENTRUM SERWISU FIX093 - BUDOWANIE WSZYSTKICH ELEMENTOW
pushd "%~dp0"
set "LOGDIR=%~dp0dist\build-logs"
if not exist "%LOGDIR%" mkdir "%LOGDIR%"
for %%F in (PORTABLE.status MODERN_INSTALLER.status XP_INSTALLER.status) do if exist "%LOGDIR%\%%F" del /q "%LOGDIR%\%%F" >nul 2>&1
set "S_RC=1"
set "P_RC=1"
set "M_RC=1"
set "X_RC=0"
set "V_RC=1"
>"%LOGDIR%\BUILD_SUMMARY.txt" echo KOMPUTEROWE CENTRUM SERWISU FIX069 - PODSUMOWANIE BUDOWANIA
>>"%LOGDIR%\BUILD_SUMMARY.txt" echo Date: %DATE% %TIME%
echo ============================================================
echo KOMPUTEROWE CENTRUM SERWISU - CENTRUM MIGRACJI I NAPRAW
echo FIX069 - MENEDZER BUDOWANIA / NIEZALEZNE ETAPY
echo ============================================================
echo.

echo [0/5] Kontrola pakietu zrodlowego...
if /i "%~2"=="/skip-source-check" (
  set "S_RC=0"
  echo [PASS] CHECK_SOURCE already completed by the single master CMD.
  >>"%LOGDIR%\BUILD_SUMMARY.txt" echo [PASS] Source check completed by master launcher (not repeated).
) else (
  call "%~dp0CHECK_SOURCE.cmd" /nopause > "%LOGDIR%\stage-source-output.log" 2>&1
  set "S_RC=!ERRORLEVEL!"
  type "%LOGDIR%\stage-source-output.log"
  if "!S_RC!"=="0" (>>"%LOGDIR%\BUILD_SUMMARY.txt" echo [PASS] Source check) else (>>"%LOGDIR%\BUILD_SUMMARY.txt" echo [FAIL] Source check)
)

echo.
echo [1/5] Budowanie programu i wersji przenosnej...
if "%S_RC%"=="0" (
  call "%~dp0BUILD_PORTABLE.cmd" /nopause > "%LOGDIR%\stage-portable-output.log" 2>&1
  set "P_RC=!ERRORLEVEL!"
  type "%LOGDIR%\stage-portable-output.log"
  if "!P_RC!"=="0" (>>"%LOGDIR%\BUILD_SUMMARY.txt" echo [PASS] Portable EXE) else (>>"%LOGDIR%\BUILD_SUMMARY.txt" echo [FAIL] Portable EXE)
) else (
  set "P_RC=1"
  echo [BLOCKED] Source check failed. Portable compilation was not run.
  >>"%LOGDIR%\BUILD_SUMMARY.txt" echo [BLOCKED] Portable build not run because source check failed.
)

echo.
echo [2/5] Budowanie instalatora Windows 7 SP1-Windows 11...
if "%P_RC%"=="0" (
  call "%~dp0BUILD_INSTALLER_MODERN.cmd" /nopause > "%LOGDIR%\stage-modern-output.log" 2>&1
  set "M_RC=!ERRORLEVEL!"
  type "%LOGDIR%\stage-modern-output.log"
  if "!M_RC!"=="0" (>>"%LOGDIR%\BUILD_SUMMARY.txt" echo [PASS] Modern installer) else (>>"%LOGDIR%\BUILD_SUMMARY.txt" echo [FAIL] Modern installer)
) else (
  set "M_RC=1"
  echo [BLOCKED] Portable compilation failed. Modern installer was NOT run; a stale FIX029/FIX031 EXE will not be packaged.
  >>"%LOGDIR%\BUILD_SUMMARY.txt" echo [BLOCKED] Modern installer not run because fresh Budowanie wersji przenosnej nie powiodlo sie.
)

echo.
echo [3/5] Building optional XP installer...
if "%P_RC%"=="0" (
  call "%~dp0BUILD_INSTALLER_XP.cmd" /nopause > "%LOGDIR%\stage-xp-output.log" 2>&1
  set "X_RC=!ERRORLEVEL!"
  type "%LOGDIR%\stage-xp-output.log"
) else (
  set "X_RC=0"
  echo [SKIP] XP installer skipped because no fresh verified FIX069 payload exists.
)
if exist "%LOGDIR%\XP_INSTALLER.status" (>>"%LOGDIR%\BUILD_SUMMARY.txt" type "%LOGDIR%\XP_INSTALLER.status") else (>>"%LOGDIR%\BUILD_SUMMARY.txt" echo [SKIP] XP installer)

echo.
echo [4/5] Verifying required outputs (Portable + modern installer + build identities)...
call "%~dp0VERIFY_BUILD.cmd" /nopause > "%LOGDIR%\stage-verification-output.log" 2>&1
set "V_RC=%ERRORLEVEL%"
type "%LOGDIR%\stage-verification-output.log"
if "%V_RC%"=="0" (>>"%LOGDIR%\BUILD_SUMMARY.txt" echo [PASS] Full output verification) else (>>"%LOGDIR%\BUILD_SUMMARY.txt" echo [FAIL] File verification)

>>"%LOGDIR%\BUILD_SUMMARY.txt" echo.
>>"%LOGDIR%\BUILD_SUMMARY.txt" echo Source check exit code: %S_RC%
>>"%LOGDIR%\BUILD_SUMMARY.txt" echo Portable exit code: %P_RC%
>>"%LOGDIR%\BUILD_SUMMARY.txt" echo Modern installer exit code: %M_RC%
>>"%LOGDIR%\BUILD_SUMMARY.txt" echo XP installer exit code: %X_RC% (optional)
>>"%LOGDIR%\BUILD_SUMMARY.txt" echo Verification exit code: %V_RC%

echo.
echo ============================================================
echo PODSUMOWANIE BUDOWANIA
echo ============================================================
type "%LOGDIR%\BUILD_SUMMARY.txt"
echo.
echo Logs: %LOGDIR%
if not "%S_RC%"=="0" goto :fail
if not "%P_RC%"=="0" goto :fail
if not "%M_RC%"=="0" goto :fail
if not "%V_RC%"=="0" goto :fail
echo [PASS] Required Portable + modern installer + required file checks completed.
echo [INFO] All completed stages and their output files remain in dist. XP is optional.
echo [INFO] Missing XP compiler is OPTIONAL and does not fail BUILD ALL.
if /i not "%~1"=="/nopause" pause
popd
exit /b 0

:fail
echo [FAIL] Build incomplete. Successful artifacts were preserved; use BUILD_MANAGER.cmd to rerun only the failed stage.
echo [INFO] See BUILD_SUMMARY.txt and individual stage logs. No successful EXE is intentionally removed.
if /i not "%~1"=="/nopause" pause
popd
exit /b 1
