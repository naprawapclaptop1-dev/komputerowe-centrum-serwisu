@echo off

setlocal EnableExtensions DisableDelayedExpansion

chcp 65001 >nul

title KOMPUTEROWE CENTRUM SERWISU FIX136 - KONTROLA AKTYWNEGO PAKIETU

pushd "%~dp0" >nul 2>&1

if errorlevel 1 exit /b 2

set "KCS_CHECK_FAILED=0"

set "KCS_CHECK_LOG=%~dp0dist\build-logs\CHECK_SOURCE_FIX136.log"

set "KCS_TEST_OUTPUT=%~dp0dist\build-logs\CHECK_SOURCE_FIX136-current.txt"

if not exist "%~dp0dist\build-logs" mkdir "%~dp0dist\build-logs" >nul 2>&1

>"%KCS_CHECK_LOG%" echo CHECK_SOURCE FIX135 - %DATE% %TIME%

echo ============================================================

echo CHECK SOURCE - AKTYWNE TESTY FIX136

echo Raport diagnostyczny: dist\build-logs\CHECK_SOURCE_FIX136.log

echo ============================================================

for %%F in (URUCHOM_TYLKO_TEN_PLIK.cmd KCS_FIX101_WORKER.cmd CHECK_FIX105_BUILD_FLOW.ps1 CHECK_FIX107_UPDATER_ENDPOINTS.ps1 CHECK_FIX108_RELEASE_PUBLISHING.ps1 CHECK_FIX110_BUILD_DIAGNOSTICS.ps1 CHECK_FIX111_BUILD_ALL_SYNTAX.ps1 FIX111_RELEASE_NOTES.txt FIX111_MODULE_MAP.txt CHECK_FIX112_VERIFICATION.ps1 CHECK_FIX113_WRAPPER_REPORT.ps1 CHECK_FIX114_ROOT_ARGUMENT.ps1 CHECK_FIX115_ROOT_INITIALIZATION.ps1 CHECK_FIX116_RELEASE_VERSION_NORMALIZATION.ps1 FIX116_RELEASE_NOTES.txt FIX116_MODULE_MAP.txt CHECK_FIX117_WEBSITE_FEATURES.ps1 FIX117_RELEASE_NOTES.txt FIX117_MODULE_MAP.txt CHECK_FIX118_WEBSITE_REGRESSION.ps1 FIX118_RELEASE_NOTES.txt FIX118_MODULE_MAP.txt KCS_RELEASE_POLICY.ps1 CHECK_FIX119_PUBLISHED_RELEASE_PRESERVATION.ps1 FIX119_RELEASE_NOTES.txt FIX119_MODULE_MAP.txt CHECK_FIX120_POWERSHELL_INTERPOLATION.ps1 FIX120_RELEASE_NOTES.txt FIX120_MODULE_MAP.txt CHECK_FIX121_PUBLIC_HTTP_TEXT.ps1 FIX121_RELEASE_NOTES.txt FIX121_MODULE_MAP.txt CHECK_FIX122_INSTALL_VERSION_NORMALIZATION.ps1 FIX122_RELEASE_NOTES.txt FIX122_MODULE_MAP.txt CHECK_FIX123_INSTALLER_INITIALIZATION.ps1 FIX123_RELEASE_NOTES.txt FIX123_MODULE_MAP.txt CHECK_FIX124_SOURCE_GATE_DIAGNOSTICS.ps1 FIX124_RELEASE_NOTES.txt FIX124_MODULE_MAP.txt CHECK_FIX125_DIAGNOSTICS_PROPAGATION.ps1 FIX125_RELEASE_NOTES.txt FIX125_MODULE_MAP.txt CHECK_FIX126_SOURCE_GATE_EXIT_CODE.ps1 FIX126_RELEASE_NOTES.txt FIX126_MODULE_MAP.txt CHECK_FIX127_PUBLISHER_VERSION_RESOLVER.ps1 FIX127_RELEASE_NOTES.txt FIX127_MODULE_MAP.txt CHECK_FIX128_INTERACTIVE_INSTALL_CONSENT.ps1 FIX128_RELEASE_NOTES.txt FIX128_MODULE_MAP.txt CHECK_FIX129_CONFIG_PERSISTENCE.ps1 FIX129_RELEASE_NOTES.txt FIX129_MODULE_MAP.txt CHECK_FIX130_DIAGNOSTICS_MONITORING.ps1 FIX130_RELEASE_NOTES.txt FIX130_MODULE_MAP.txt CHECK_FIX131_WEBSITE_PRODUCT_MARKER.ps1 FIX131_RELEASE_NOTES.txt FIX131_MODULE_MAP.txt CHECK_FIX132_HISTORICAL_TEST_IDENTITY.ps1 FIX132_RELEASE_NOTES.txt FIX132_MODULE_MAP.txt CHECK_FIX133_CRLF_IDENTITY_NORMALIZATION.ps1 FIX133_RELEASE_NOTES.txt FIX133_MODULE_MAP.txt CHECK_FIX134_RELEASE_POLICY_SYNTAX.ps1 FIX134_RELEASE_NOTES.txt FIX134_MODULE_MAP.txt CHECK_FIX135_SOURCE_GATE_EXIT_CAPTURE.ps1 FIX135_RELEASE_NOTES.txt FIX135_MODULE_MAP.txt CHECK_FIX072_REPOSITORY_INPUT.ps1 CHECK_FIX136_SOURCE_BUILD_IDENTITY.ps1 FIX136_RELEASE_NOTES.txt FIX136_MODULE_MAP.txt website\media\prezentacja.vtt website\media\prezentacja-en.vtt VERIFY_BUILD.ps1 FIX115_RELEASE_NOTES.txt FIX115_MODULE_MAP.txt FIX112_RELEASE_NOTES.txt FIX112_MODULE_MAP.txt FIX113_RELEASE_NOTES.txt FIX113_MODULE_MAP.txt FIX114_RELEASE_NOTES.txt FIX114_MODULE_MAP.txt FIX110_RELEASE_NOTES.txt FIX110_MODULE_MAP.txt FIX107_RELEASE_NOTES.txt FIX107_MODULE_MAP.txt FIX108_RELEASE_NOTES.txt FIX108_MODULE_MAP.txt FIX099_PACKAGE_MARKER.txt FIX099_POWERSHELL_MANIFEST.txt VALIDATE_FIX100_PACKAGE.ps1 CHECK_FIX101_KEEP_OPEN.ps1 FIX101_RELEASE_NOTES.txt FIX101_MODULE_MAP.txt CHECK_FIX100_PIPELINE.ps1 CHECK_FIX099_PAGES_TRIGGER.ps1 CHECK_FIX100_CLEANUP_PATH.ps1 CHECK_FIX100_SOURCE_SCOPE.ps1 CHECK_FIX100_ROOT_PATH.ps1 FIX099_CLEANUP_SCOPE.txt FIX099_NETWORK_SCOPE.txt CLEAN_SAFE_TEMP.ps1 FIX094_PACKAGE_MARKER.txt CHECK_FIX094_KEEP_OPEN.ps1 PUBLISH_GITHUB_SOURCE.ps1 PUBLISH_GITHUB_RELEASES.ps1 BUILD_ALL.cmd BUILD_PORTABLE.cmd BUILD_INSTALLER_MODERN.cmd VERIFY_BUILD.cmd VERIFY_PUBLIC_DEPLOYMENT.ps1 INSTALL_PUBLISHED_BUILD.ps1 WindowsVersionSwitcherPRO.cs WindowsVersionSwitcherPRO.Modules.cs AssemblyInfo.cs app.manifest NaprawaPC.ico CentrumMigracjiHero.png SETUP_MODERN.iss website\index.html website\styles.css website\app.js website\media\prezentacja.mp4 .github\workflows\deploy-pages.yml) do (

  if exist "%~dp0%%F" (

    echo [PASS] Required: %%F

  ) else (

    echo [FAIL] Missing: %%F

    >>"%KCS_CHECK_LOG%" echo [FAIL] Missing required file: %%F

    set "KCS_CHECK_FAILED=1"

  )

)

if not "%KCS_CHECK_FAILED%"=="0" goto :done

call :run_ps_check "CHECK_FIX069_REGRESSION.ps1" "Product compatibility FIX069"

call :run_ps_check "CHECK_FIX083_INTERPOLATION.ps1" "PowerShell interpolation"

call :run_ps_check "CHECK_FIX083_NATIVE_PROCESS.ps1" "Native process runner"

call :run_ps_check "CHECK_FIX084_CMD_ENCODING.ps1" "CMD encoding"

call :run_ps_check "CHECK_FIX084_PAGES_CONFIGURATION.ps1" "GitHub Pages configuration"

call :run_ps_check "CHECK_FIX084_SOURCE_CACHE_EXCLUSIONS.ps1" "Source cache exclusions"

call :run_ps_check "CHECK_FIX085_GIT_CLONE_LONGPATHS.ps1" "Git long paths and cache"

call :run_ps_check "CHECK_FIX099_PAGES_TRIGGER.ps1" "Pages trigger"

call :run_ps_check "CHECK_FIX100_ROOT_PATH.ps1" "Root-path FIX100"

call :run_ps_check "CHECK_FIX101_KEEP_OPEN.ps1" "Persistent CMD FIX101"

call :run_ps_check "CHECK_FIX102_SOURCE_GATE.ps1" "Source gate FIX102"

call :run_ps_check "CHECK_FIX104_BUILD_ISOLATION.ps1" "Build isolation FIX104"

call :run_ps_check "CHECK_FIX105_BUILD_FLOW.ps1" "Build-flow FIX105"

call :run_ps_check "CHECK_FIX107_UPDATER_ENDPOINTS.ps1" "Updater endpoints FIX107"

call :run_ps_check "CHECK_FIX108_RELEASE_PUBLISHING.ps1" "Release publishing FIX108"

call :run_ps_check "CHECK_FIX110_BUILD_DIAGNOSTICS.ps1" "Build diagnostics FIX110"

call :run_ps_check "CHECK_FIX111_BUILD_ALL_SYNTAX.ps1" "BUILD_ALL syntax FIX111"

call :run_ps_check "CHECK_FIX112_VERIFICATION.ps1" "Verification FIX112"

call :run_ps_check "CHECK_FIX113_WRAPPER_REPORT.ps1" "Verifier report FIX113"

call :run_ps_check "CHECK_FIX114_ROOT_ARGUMENT.ps1" "Verifier root argument FIX114"

call :run_ps_check "CHECK_FIX115_ROOT_INITIALIZATION.ps1" "Verifier root initialization FIX115"

call :run_ps_check "CHECK_FIX116_RELEASE_VERSION_NORMALIZATION.ps1" "Release FileVersion normalization FIX116"

call :run_ps_check "CHECK_FIX117_WEBSITE_FEATURES.ps1" "Website features FIX117"

call :run_ps_check "CHECK_FIX118_WEBSITE_REGRESSION.ps1" "Website regression FIX118"

call :run_ps_check "CHECK_FIX119_PUBLISHED_RELEASE_PRESERVATION.ps1" "Published-release preservation FIX119"

call :run_ps_check "CHECK_FIX120_POWERSHELL_INTERPOLATION.ps1" "PowerShell interpolation FIX120"

call :run_ps_check "CHECK_FIX121_PUBLIC_HTTP_TEXT.ps1" "Public HTTP response decoding FIX121"

call :run_ps_check "CHECK_FIX122_INSTALL_VERSION_NORMALIZATION.ps1" "Install FileVersion normalization FIX122"

call :run_ps_check "CHECK_FIX123_INSTALLER_INITIALIZATION.ps1" "Installer initialization diagnostics FIX123"

call :run_ps_check "CHECK_FIX124_SOURCE_GATE_DIAGNOSTICS.ps1" "Source-gate diagnostics FIX124"

call :run_ps_check "CHECK_FIX125_DIAGNOSTICS_PROPAGATION.ps1" "Diagnostic propagation FIX125"

call :run_ps_check "CHECK_FIX126_SOURCE_GATE_EXIT_CODE.ps1" "Source-gate exit-code FIX126"

call :run_ps_check "CHECK_FIX127_PUBLISHER_VERSION_RESOLVER.ps1" "Publisher version resolver FIX127"

call :run_ps_check "CHECK_FIX128_INTERACTIVE_INSTALL_CONSENT.ps1" "Interactive installer risk acknowledgement FIX128"

call :run_ps_check "CHECK_FIX129_CONFIG_PERSISTENCE.ps1" "Configuration persistence and recovery FIX129"

call :run_ps_check "CHECK_FIX130_DIAGNOSTICS_MONITORING.ps1" "Hardware monitoring, disk health and reporting FIX130"

call :run_ps_check "CHECK_FIX131_WEBSITE_PRODUCT_MARKER.ps1" "Website product marker synchronization FIX131"

call :run_ps_check "CHECK_FIX132_HISTORICAL_TEST_IDENTITY.ps1" "Historical test package identity FIX132"
call :run_ps_check "CHECK_FIX133_CRLF_IDENTITY_NORMALIZATION.ps1" "CRLF source identity normalization FIX133"

call :run_ps_check "CHECK_FIX134_RELEASE_POLICY_SYNTAX.ps1" "Release policy PowerShell syntax FIX134"

call :run_ps_check "CHECK_FIX072_REPOSITORY_INPUT.ps1" "FIX072 repository and payload source inputs"

call :run_ps_check "CHECK_FIX135_SOURCE_GATE_EXIT_CAPTURE.ps1" "Immediate PowerShell exit-code capture FIX135"

call :run_ps_check "CHECK_FIX136_SOURCE_BUILD_IDENTITY.ps1" "FIX072 source/build identity and fail-fast pipeline FIX136"

call :run_ps_check "CHECK_FIX100_CLEANUP_PATH.ps1" "Package-local cleanup FIX100"

call :run_ps_check "CHECK_FIX100_SOURCE_SCOPE.ps1" "Source allowlist FIX100"

call :run_ps_check "CHECK_FIX100_PIPELINE.ps1" "Pipeline FIX100"

:done

if "%KCS_CHECK_FAILED%"=="0" (

  echo [PASS] Current source/build/release gates completed.

  >>"%KCS_CHECK_LOG%" echo [PASS] Current source/build/release gates completed.

) else (

  echo [FAIL] Current source/build/release gate failed. See dist\build-logs\CHECK_SOURCE_FIX136.log for the exact failing child process and exit code.

  >>"%KCS_CHECK_LOG%" echo [FAIL] Current source/build/release gate failed.

)

if exist "%KCS_TEST_OUTPUT%" del /q "%KCS_TEST_OUTPUT%" >nul 2>&1

popd

if /i not "%~1"=="/nopause" pause

if "%KCS_CHECK_FAILED%"=="0" exit /b 0

exit /b 1



:run_ps_check

set "KCS_TEST_NAME=%~1"

if exist "%KCS_TEST_OUTPUT%" del /q "%KCS_TEST_OUTPUT%" >nul 2>&1

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0%~1" >"%KCS_TEST_OUTPUT%" 2>&1
set "KCS_TEST_RC=%ERRORLEVEL%"

if exist "%KCS_TEST_OUTPUT%" (

  type "%KCS_TEST_OUTPUT%"

  >>"%KCS_CHECK_LOG%" echo ------------------------------------------------------------

  >>"%KCS_CHECK_LOG%" echo [OUTPUT] %KCS_TEST_NAME%

  type "%KCS_TEST_OUTPUT%" >>"%KCS_CHECK_LOG%"

)

>>"%KCS_CHECK_LOG%" echo [EXIT] %KCS_TEST_NAME% = %KCS_TEST_RC%

if "%KCS_TEST_RC%"=="0" goto :run_ps_check_pass

echo [FAIL] %KCS_TEST_NAME% (exit=%KCS_TEST_RC%)

>>"%KCS_CHECK_LOG%" echo [FAIL] %KCS_TEST_NAME% (exit=%KCS_TEST_RC%)

set "KCS_CHECK_FAILED=1"

goto :run_ps_check_return

:run_ps_check_pass

echo [PASS] %KCS_TEST_NAME% (exit=0)

:run_ps_check_return

exit /b 0

