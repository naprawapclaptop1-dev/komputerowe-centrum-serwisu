$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$cmdPath = Join-Path $root 'CHECK_SOURCE.cmd'
$validatorPath = Join-Path $root 'VALIDATE_FIX100_PACKAGE.ps1'
$allowlistPath = Join-Path $root 'FIX099_SOURCE_ALLOWLIST.txt'
$cmd = Get-Content -LiteralPath $cmdPath -Raw -Encoding UTF8
$validator = Get-Content -LiteralPath $validatorPath -Raw -Encoding UTF8
$allowlist = @(Get-Content -LiteralPath $allowlistPath | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$releasePolicyTest = Get-Content -LiteralPath (Join-Path $root 'CHECK_FIX119_PUBLISHED_RELEASE_PRESERVATION.ps1') -Raw -Encoding UTF8
$worker = Get-Content -LiteralPath (Join-Path $root 'KCS_FIX101_WORKER.cmd') -Raw -Encoding UTF8
$entrypoint = Get-Content -LiteralPath (Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd') -Raw -Encoding UTF8
$bytes = [IO.File]::ReadAllBytes($cmdPath)
$checks = @()
function Add-Check { param([bool]$Passed,[string]$Name); $script:checks += [pscustomobject]@{Passed=$Passed;Name=$Name} }
function Test-PowerShellParse { param([string]$Path); $tokens=$null; $errors=$null; [System.Management.Automation.Language.Parser]::ParseFile($Path,[ref]$tokens,[ref]$errors) | Out-Null; return ($errors.Count -eq 0) }
Add-Check ($bytes.Length -gt 0 -and $bytes[0] -eq 64) 'CHECK_SOURCE remains BOM-free and starts with @echo off'
Add-Check ($cmd.Contains('set "KCS_CHECK_FAILED=0"') -and $cmd.Contains('set "KCS_CHECK_FAILED=1"') -and -not $cmd.Contains('set "FAILED=1"')) 'Source gate uses a dedicated failure flag, not a generic stale variable'
Add-Check ($cmd.Contains(':run_ps_check') -and $cmd.Contains('call :run_ps_check')) 'Every PowerShell check is executed through one result-capturing subroutine'
Add-Check ($cmd.Contains('set "KCS_TEST_RC=%ERRORLEVEL%"') -and $cmd.Contains('if "%KCS_TEST_RC%"=="0" goto :run_ps_check_pass') -and $cmd.Contains('goto :run_ps_check_return')) 'Actual child process exit code is captured immediately and evaluated explicitly' 
$currentFixMatch = [regex]::Match($cmd, '(?im)^title\s+.*?(?<fix>FIX\d{3})')
$currentFix = $currentFixMatch.Groups['fix'].Value
$reportName = 'CHECK_SOURCE_' + $currentFix + '.log'
Add-Check ($currentFixMatch.Success -and $cmd.Contains($reportName) -and $cmd.Contains('[EXIT] %KCS_TEST_NAME% = %KCS_TEST_RC%')) 'A persistent diagnostic log records test names and exact exit codes for the active package' 
Add-Check ($cmd.Contains('type "%KCS_TEST_OUTPUT%" >>"%KCS_CHECK_LOG%"') -and $cmd.Contains('>"%KCS_TEST_OUTPUT%" 2>&1')) 'Complete child test output is retained in the diagnostic log'
Add-Check ($cmd.Contains('goto :done') -and $cmd.Contains('if "%KCS_CHECK_FAILED%"=="0" exit /b 0') -and $cmd.Contains('exit /b 1')) 'Missing files and failed child tests produce a deterministic nonzero source-gate result'
Add-Check ($validator.Contains('CHECK_FIX124_SOURCE_GATE_DIAGNOSTICS.ps1') -and $validator.Contains('FIX124_RELEASE_NOTES.txt') -and $validator.Contains('FIX124_MODULE_MAP.txt')) 'Full-package validator requires the FIX124 test and documentation'
Add-Check ($allowlist -contains 'CHECK_FIX124_SOURCE_GATE_DIAGNOSTICS.ps1' -and $allowlist -contains 'FIX124_RELEASE_NOTES.txt' -and $allowlist -contains 'FIX124_MODULE_MAP.txt') 'Explicit publication allowlist contains the FIX124 test and documentation'
$safeBlock = [regex]::Match($releasePolicyTest, '\$safePaths\s*=\s*@\((.*?)\)', [Text.RegularExpressions.RegexOptions]::Singleline).Groups[1].Value
$currentBlock = [regex]::Match($releasePolicyTest, '\$currentTagChanges\s*=\s*@\((.*?)\)', [Text.RegularExpressions.RegexOptions]::Singleline).Groups[1].Value
Add-Check ($safeBlock.Contains('CHECK_FIX124_SOURCE_GATE_DIAGNOSTICS.ps1') -and $safeBlock.Contains('FIX124_RELEASE_NOTES.txt') -and $safeBlock.Contains('FIX124_MODULE_MAP.txt')) 'FIX124 test and historical docs remain classified as safe tooling paths'
Add-Check ($currentBlock.Contains('CHECK_FIX124_SOURCE_GATE_DIAGNOSTICS.ps1') -and -not $currentBlock.Contains('FIX124_RELEASE_NOTES.txt') -and -not $currentBlock.Contains('FIX124_MODULE_MAP.txt')) 'Only the FIX124 test changed in this package; its historical docs remain unchanged'
Add-Check ($safeBlock.Contains('KCS_FIX101_WORKER.cmd') -and $safeBlock.Contains('URUCHOM_TYLKO_TEN_PLIK.cmd') -and $currentBlock.Contains('KCS_FIX101_WORKER.cmd') -and $currentBlock.Contains('URUCHOM_TYLKO_TEN_PLIK.cmd')) 'Launcher and persistent worker paths are classified as packaging tooling'
Add-Check ($currentFixMatch.Success -and $worker.Contains($currentFix) -and $entrypoint.Contains($currentFix)) 'Persistent worker and the single CMD entrypoint display the active package identity' 
$expected = @('CHECK_FIX069_REGRESSION.ps1','CHECK_FIX083_INTERPOLATION.ps1','CHECK_FIX083_NATIVE_PROCESS.ps1','CHECK_FIX084_CMD_ENCODING.ps1','CHECK_FIX084_PAGES_CONFIGURATION.ps1','CHECK_FIX084_SOURCE_CACHE_EXCLUSIONS.ps1','CHECK_FIX085_GIT_CLONE_LONGPATHS.ps1','CHECK_FIX099_PAGES_TRIGGER.ps1','CHECK_FIX100_ROOT_PATH.ps1','CHECK_FIX101_KEEP_OPEN.ps1','CHECK_FIX102_SOURCE_GATE.ps1','CHECK_FIX104_BUILD_ISOLATION.ps1','CHECK_FIX105_BUILD_FLOW.ps1','CHECK_FIX107_UPDATER_ENDPOINTS.ps1','CHECK_FIX108_RELEASE_PUBLISHING.ps1','CHECK_FIX110_BUILD_DIAGNOSTICS.ps1','CHECK_FIX111_BUILD_ALL_SYNTAX.ps1','CHECK_FIX112_VERIFICATION.ps1','CHECK_FIX113_WRAPPER_REPORT.ps1','CHECK_FIX114_ROOT_ARGUMENT.ps1','CHECK_FIX115_ROOT_INITIALIZATION.ps1','CHECK_FIX116_RELEASE_VERSION_NORMALIZATION.ps1','CHECK_FIX117_WEBSITE_FEATURES.ps1','CHECK_FIX118_WEBSITE_REGRESSION.ps1','CHECK_FIX119_PUBLISHED_RELEASE_PRESERVATION.ps1','CHECK_FIX120_POWERSHELL_INTERPOLATION.ps1','CHECK_FIX121_PUBLIC_HTTP_TEXT.ps1','CHECK_FIX122_INSTALL_VERSION_NORMALIZATION.ps1','CHECK_FIX123_INSTALLER_INITIALIZATION.ps1','CHECK_FIX124_SOURCE_GATE_DIAGNOSTICS.ps1','CHECK_FIX125_DIAGNOSTICS_PROPAGATION.ps1','CHECK_FIX126_SOURCE_GATE_EXIT_CODE.ps1','CHECK_FIX100_CLEANUP_PATH.ps1','CHECK_FIX100_SOURCE_SCOPE.ps1','CHECK_FIX100_PIPELINE.ps1')
$missing = @($expected | Where-Object { -not $cmd.Contains(('call :run_ps_check "' + $_ + '"')) })
Add-Check ($missing.Count -eq 0) 'All previously active FIX regression checks are still called by CHECK_SOURCE'
Add-Check (Test-PowerShellParse -Path $validatorPath) 'Package validator still parses after the FIX124 requirement update'
$failed = @($checks | Where-Object { -not $_.Passed })
foreach ($check in $checks) { if ($check.Passed) { Write-Host ('[PASS] ' + $check.Name) } else { Write-Host ('[FAIL] ' + $check.Name) } }
if ($failed.Count) { Write-Host ('[FAIL] FIX124 source-gate diagnostics checks: ' + (($failed | ForEach-Object { $_.Name }) -join '; ')); exit 1 }
Write-Host ("[PASS] FIX124 source-gate diagnostics checks: {0}/{0}" -f $checks.Count)
exit 0
