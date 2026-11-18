@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
title KOMPUTEROWE CENTRUM SERWISU FIX100 - KONTROLA AKTYWNEGO PAKIETU
pushd "%~dp0" >nul 2>&1
if errorlevel 1 exit /b 2
set "FAILED=0"
echo ============================================================
echo CHECK SOURCE - AKTYWNE TESTY FIX100
echo ============================================================
for %%F in (URUCHOM_TYLKO_TEN_PLIK.cmd KCS_FIX101_WORKER.cmd FIX099_PACKAGE_MARKER.txt FIX099_POWERSHELL_MANIFEST.txt VALIDATE_FIX100_PACKAGE.ps1 CHECK_FIX101_KEEP_OPEN.ps1 FIX101_RELEASE_NOTES.txt FIX101_MODULE_MAP.txt CHECK_FIX100_PIPELINE.ps1 CHECK_FIX099_PAGES_TRIGGER.ps1 CHECK_FIX100_CLEANUP_PATH.ps1 CHECK_FIX100_SOURCE_SCOPE.ps1 CHECK_FIX100_ROOT_PATH.ps1 FIX099_CLEANUP_SCOPE.txt FIX099_NETWORK_SCOPE.txt CLEAN_SAFE_TEMP.ps1 FIX094_PACKAGE_MARKER.txt CHECK_FIX094_KEEP_OPEN.ps1 PUBLISH_GITHUB_SOURCE.ps1 PUBLISH_GITHUB_RELEASES.ps1 BUILD_ALL.cmd BUILD_PORTABLE.cmd BUILD_INSTALLER_MODERN.cmd VERIFY_BUILD.cmd VERIFY_PUBLIC_DEPLOYMENT.ps1 INSTALL_PUBLISHED_BUILD.ps1 WindowsVersionSwitcherPRO.cs WindowsVersionSwitcherPRO.Modules.cs AssemblyInfo.cs app.manifest NaprawaPC.ico CentrumMigracjiHero.png SETUP_MODERN.iss website\index.html website\styles.css website\app.js website\media\prezentacja.mp4 .github\workflows\deploy-pages.yml) do (
  if exist "%~dp0%%F" (echo [PASS] %%F) else (echo [FAIL] Missing: %%F& set "FAILED=1")
)
if not "%FAILED%"=="0" goto :done
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX069_REGRESSION.ps1"
if errorlevel 1 (echo [FAIL] Product FIX069 regression.& set "FAILED=1") else echo [PASS] Product compatibility FIX069
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX083_INTERPOLATION.ps1"
if errorlevel 1 (echo [FAIL] PowerShell interpolation regression.& set "FAILED=1") else echo [PASS] PowerShell interpolation
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX083_NATIVE_PROCESS.ps1"
if errorlevel 1 (echo [FAIL] Native process runner regression.& set "FAILED=1") else echo [PASS] Native process runner
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX084_CMD_ENCODING.ps1"
if errorlevel 1 (echo [FAIL] CMD encoding regression.& set "FAILED=1") else echo [PASS] CMD encoding
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX084_PAGES_CONFIGURATION.ps1"
if errorlevel 1 (echo [FAIL] GitHub Pages configuration regression.& set "FAILED=1") else echo [PASS] GitHub Pages configuration
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX084_SOURCE_CACHE_EXCLUSIONS.ps1"
if errorlevel 1 (echo [FAIL] Source cache exclusions regression.& set "FAILED=1") else echo [PASS] Source cache exclusions
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX085_GIT_CLONE_LONGPATHS.ps1"
if errorlevel 1 (echo [FAIL] Git long paths/cache regression.& set "FAILED=1") else echo [PASS] Git long paths/cache
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX099_PAGES_TRIGGER.ps1"
if errorlevel 1 (echo [FAIL] Pages trigger regression.& set "FAILED=1") else echo [PASS] Pages trigger
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX100_ROOT_PATH.ps1"
if errorlevel 1 (echo [FAIL] Root-path FIX100 regression.& set "FAILED=1") else echo [PASS] Root-path FIX100
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX101_KEEP_OPEN.ps1"
if errorlevel 1 (echo [FAIL] Persistent CMD FIX101 regression.& set "FAILED=1") else echo [PASS] Persistent CMD FIX101
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX102_SOURCE_GATE.ps1"
if errorlevel 1 (echo [FAIL] Source gate FIX102 regression.& set "FAILED=1") else echo [PASS] Source gate FIX102
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX100_CLEANUP_PATH.ps1"
if errorlevel 1 (echo [FAIL] Package-local cleanup FIX100 regression.& set "FAILED=1") else echo [PASS] Package-local cleanup FIX100
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX100_SOURCE_SCOPE.ps1"
if errorlevel 1 (echo [FAIL] Source allowlist FIX100 regression.& set "FAILED=1") else echo [PASS] Source allowlist FIX100
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX100_PIPELINE.ps1"
if errorlevel 1 (echo [FAIL] Pipeline FIX100 regression.& set "FAILED=1") else echo [PASS] Pipeline FIX100
:done
if "%FAILED%"=="0" (echo [PASS] Current source/build/release gates completed.) else echo [FAIL] Current source/build/release gate failed.
popd
if /i not "%~1"=="/nopause" pause
if "%FAILED%"=="0" exit /b 0
exit /b 1
