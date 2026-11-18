@echo off
setlocal EnableExtensions DisableDelayedExpansion
title KOMPUTEROWE CENTRUM SERWISU FIX105 - BUDOWANIE WSZYSTKICH ELEMENTOW
pushd "%~dp0"
set "LOGDIR=%~dp0dist\build-logs"
if not exist "%LOGDIR%" mkdir "%LOGDIR%"
for %%F in (PORTABLE.status MODERN_INSTALLER.status XP_INSTALLER.status) do if exist "%LOGDIR%\%%F" del /q "%LOGDIR%\%%F" >nul 2>&1
set "S_RC=1"
set "P_RC=1"
set "M_RC=1"
set "X_RC=0"
set "V_RC=1"
>"%LOGDIR%\BUILD_SUMMARY.txt" echo KOMPUTEROWE CENTRUM SERWISU FIX105 - PODSUMOWANIE BUDOWANIA
>>"%LOGDIR%\BUILD_SUMMARY.txt" echo Date: %DATE% %TIME%
echo ============================================================
echo KOMPUTEROWE CENTRUM SERWISU - CENTRUM MIGRACJI I NAPRAW
echo FIX105 - MENEDZER BUDOWANIA / PLYNNE ETAPY BEZ BLOKOW IF
echo ============================================================
echo.

echo [0/5] Kontrola pakietu zrodlowego...
if /i "%~2"=="/skip-source-check" goto :source_skipped
call "%~dp0CHECK_SOURCE.cmd" /nopause > "%LOGDIR%\stage-source-output.log" 2>&1
if errorlevel 1 goto :source_failed
type "%LOGDIR%\stage-source-output.log"
:source_skipped
set "S_RC=0"
>>"%LOGDIR%\BUILD_SUMMARY.txt" echo [PASS] Source check

echo.
echo [1/5] Budowanie programu i wersji przenosnej...
if not "%S_RC%"=="0" goto :portable_blocked
call "%~dp0BUILD_PORTABLE.cmd" /nopause > "%LOGDIR%\stage-portable-output.log" 2>&1
set "P_RC=%ERRORLEVEL%"
type "%LOGDIR%\stage-portable-output.log"
if not "%P_RC%"=="0" goto :portable_failed
>>"%LOGDIR%\BUILD_SUMMARY.txt" echo [PASS] Portable EXE

echo.
echo [2/5] Budowanie instalatora Windows 7 SP1-Windows 11...
call "%~dp0BUILD_INSTALLER_MODERN.cmd" /nopause > "%LOGDIR%\stage-modern-output.log" 2>&1
set "M_RC=%ERRORLEVEL%"
type "%LOGDIR%\stage-modern-output.log"
if not "%M_RC%"=="0" goto :modern_failed
>>"%LOGDIR%\BUILD_SUMMARY.txt" echo [PASS] Modern installer

echo.
echo [3/5] Building optional XP installer...
call "%~dp0BUILD_INSTALLER_XP.cmd" /nopause > "%LOGDIR%\stage-xp-output.log" 2>&1
set "X_RC=%ERRORLEVEL%"
type "%LOGDIR%\stage-xp-output.log"
if not "%X_RC%"=="0" goto :xp_optional_failed
>>"%LOGDIR%\BUILD_SUMMARY.txt" echo [PASS] Optional XP installer
 goto :verify
:xp_optional_failed
echo [WARN] Optional XP installer failed; modern installer and portable remain eligible.
>>"%LOGDIR%\BUILD_SUMMARY.txt" echo [WARN] Optional XP installer failed; not blocking release.
set "X_RC=0"

:verify
echo.
echo [4/5] Verifying required outputs Portable and modern installer...
call "%~dp0VERIFY_BUILD.cmd" /nopause > "%LOGDIR%\stage-verification-output.log" 2>&1
set "V_RC=%ERRORLEVEL%"
type "%LOGDIR%\stage-verification-output.log"
if not "%V_RC%"=="0" goto :verification_failed
>>"%LOGDIR%\BUILD_SUMMARY.txt" echo [PASS] Full output verification

echo.
echo ============================================================
echo PODSUMOWANIE BUDOWANIA
echo ============================================================
>>"%LOGDIR%\BUILD_SUMMARY.txt" echo.
>>"%LOGDIR%\BUILD_SUMMARY.txt" echo Source check exit code: %S_RC%
>>"%LOGDIR%\BUILD_SUMMARY.txt" echo Portable exit code: %P_RC%
>>"%LOGDIR%\BUILD_SUMMARY.txt" echo Modern installer exit code: %M_RC%
>>"%LOGDIR%\BUILD_SUMMARY.txt" echo XP installer exit code: %X_RC% optional
echo Verification exit code: %V_RC%
type "%LOGDIR%\BUILD_SUMMARY.txt"
echo [PASS] Required Portable, modern installer and file checks completed.
echo [INFO] Successful artifacts remain in dist. XP is optional.
if /i not "%~1"=="/nopause" pause
popd
exit /b 0

:source_failed
set "S_RC=1"
type "%LOGDIR%\stage-source-output.log"
>>"%LOGDIR%\BUILD_SUMMARY.txt" echo [FAIL] Source check
 goto :fail
:portable_blocked
echo [BLOCKED] Source check failed. Portable compilation was not run.
>>"%LOGDIR%\BUILD_SUMMARY.txt" echo [BLOCKED] Portable build not run because source check failed.
goto :fail
:portable_failed
>>"%LOGDIR%\BUILD_SUMMARY.txt" echo [FAIL] Portable EXE
goto :fail
:modern_failed
>>"%LOGDIR%\BUILD_SUMMARY.txt" echo [FAIL] Modern installer
goto :fail
:verification_failed
>>"%LOGDIR%\BUILD_SUMMARY.txt" echo [FAIL] File verification
goto :fail
:fail
echo.
echo ============================================================
echo [FAIL] Build incomplete. Successful artifacts were preserved.
echo [INFO] See BUILD_SUMMARY.txt and individual stage logs.
echo ============================================================
type "%LOGDIR%\BUILD_SUMMARY.txt"
echo Logs: %LOGDIR%
if /i not "%~1"=="/nopause" pause
popd
exit /b 1
