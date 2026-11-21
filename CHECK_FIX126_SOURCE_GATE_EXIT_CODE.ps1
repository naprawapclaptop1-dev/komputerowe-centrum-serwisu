$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$cmdPath = Join-Path $root 'CHECK_SOURCE.cmd'
$workerPath = Join-Path $root 'KCS_FIX101_WORKER.cmd'
$entryPath = Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd'
$fix116Path = Join-Path $root 'CHECK_FIX116_RELEASE_VERSION_NORMALIZATION.ps1'
$fix124Path = Join-Path $root 'CHECK_FIX124_SOURCE_GATE_DIAGNOSTICS.ps1'
$fix125Path = Join-Path $root 'CHECK_FIX125_DIAGNOSTICS_PROPAGATION.ps1'
$policyPath = Join-Path $root 'KCS_RELEASE_POLICY.ps1'
$policyTestPath = Join-Path $root 'CHECK_FIX119_PUBLISHED_RELEASE_PRESERVATION.ps1'
$validatorPath = Join-Path $root 'VALIDATE_FIX100_PACKAGE.ps1'
$allowPath = Join-Path $root 'FIX099_SOURCE_ALLOWLIST.txt'
$cmd = Get-Content -LiteralPath $cmdPath -Raw -Encoding UTF8
$worker = Get-Content -LiteralPath $workerPath -Raw -Encoding UTF8
$entry = Get-Content -LiteralPath $entryPath -Raw -Encoding UTF8
$fix116 = Get-Content -LiteralPath $fix116Path -Raw -Encoding UTF8
$fix124 = Get-Content -LiteralPath $fix124Path -Raw -Encoding UTF8
$fix125 = Get-Content -LiteralPath $fix125Path -Raw -Encoding UTF8
$policy = Get-Content -LiteralPath $policyPath -Raw -Encoding UTF8
$policyTest = Get-Content -LiteralPath $policyTestPath -Raw -Encoding UTF8
$validator = Get-Content -LiteralPath $validatorPath -Raw -Encoding UTF8
$allow = @(Get-Content -LiteralPath $allowPath | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$bytes = [IO.File]::ReadAllBytes($cmdPath)
$checks = @()
function Add-Check { param([bool]$Passed,[string]$Name); $script:checks += [pscustomobject]@{Passed=$Passed;Name=$Name} }
$currentFixMatch = [regex]::Match($cmd, '(?im)^title\s+.*?(?<fix>FIX\d{3})')
$currentFix = $currentFixMatch.Groups['fix'].Value
$reportName = 'CHECK_SOURCE_' + $currentFix + '.log'
$reportTempName = 'CHECK_SOURCE_' + $currentFix + '-current.txt'
$runnerBlock = [regex]::Match($cmd, '(?s):run_ps_check\r?\n(.*?):run_ps_check_return').Groups[1].Value
$runnerPattern = '(?s)powershell\.exe[^\r\n]*-File "%~dp0%~1"[^\r\n]*>"%KCS_TEST_OUTPUT%" 2>&1\r?\nset "KCS_TEST_RC=%ERRORLEVEL%"'
$safeBlock = [regex]::Match($policyTest, '\$safePaths\s*=\s*@\((.*?)\)', [Text.RegularExpressions.RegexOptions]::Singleline).Groups[1].Value
$currentBlock = [regex]::Match($policyTest, '\$currentTagChanges\s*=\s*@\((.*?)\)', [Text.RegularExpressions.RegexOptions]::Singleline).Groups[1].Value
Add-Check ($currentFixMatch.Success -and $currentFix -match '^FIX\d{3}$') 'Source gate declares a valid current package identity'
Add-Check ($bytes.Length -gt 0 -and $bytes[0] -eq 64 -and $cmd.StartsWith('@echo off')) 'CHECK_SOURCE is BOM-free and safe for cmd.exe'
Add-Check ($cmd.Contains($reportName) -and $cmd.Contains($reportTempName) -and $cmd.Contains('[EXIT] %KCS_TEST_NAME% = %KCS_TEST_RC%')) 'Persistent report names the active FIX identity and records each exit code'
Add-Check ([regex]::IsMatch($cmd,$runnerPattern)) 'PowerShell child exit code is captured immediately after process execution'
Add-Check ($cmd.Contains('if "%KCS_TEST_RC%"=="0" goto :run_ps_check_pass') -and $cmd.Contains(':run_ps_check_pass') -and $cmd.Contains(':run_ps_check_return')) 'Zero exit code takes an explicit PASS branch'
Add-Check ($cmd.Contains('set "KCS_CHECK_FAILED=1"') -and $cmd.Contains('goto :run_ps_check_return') -and $cmd.Contains('[FAIL] %KCS_TEST_NAME% (exit=%KCS_TEST_RC%)')) 'Nonzero exit code alone sets the persistent failure flag'
Add-Check (-not $runnerBlock.Contains(') else (') -and -not $runnerBlock.Contains('if not "%KCS_TEST_RC%"=="0"')) 'Ambiguous IF/ELSE status branch is removed'
Add-Check ($worker.Contains($currentFix) -and $entry.Contains($currentFix) -and $worker.Contains($reportName)) 'Launcher and worker agree on active package identity and detailed report path'
Add-Check ($fix124.Contains('$currentFixMatch') -and $fix124.Contains('$reportName') -and -not $fix124.Contains('Contains(''FIX124'')')) 'FIX124 historical regression test no longer hardcodes a stale current package identity'
Add-Check ($fix125.Contains('$currentFixMatch') -and $fix125.Contains('$reportName') -and -not $fix125.Contains('Contains(''FIX125'')')) 'FIX125 historical regression test follows the active package report identity'
Add-Check ($fix116.Contains('$expectedProductVersion') -and $fix116.Contains('.Exception.Message.Contains((') -and $fix116.Contains('expected=[')) 'FIX116 version mismatch assertion follows the release metadata instead of stale 1.0.0.69'
Add-Check ($policy.Contains('(URUCHOM_TYLKO_TEN_PLIK|KCS_FIX101_WORKER)')) 'Release policy explicitly permits only the known launcher and persistent worker tooling'
$expectedNew = @('CHECK_FIX126_SOURCE_GATE_EXIT_CODE.ps1','FIX126_RELEASE_NOTES.txt','FIX126_MODULE_MAP.txt')
Add-Check (($expectedNew | Where-Object { $validator.Contains($_) }).Count -eq 3) 'Full-package validation requires all FIX126 artifacts'
Add-Check (($expectedNew | Where-Object { $allow -contains $_ }).Count -eq 3) 'Explicit source allowlist includes all FIX126 artifacts'
Add-Check (($expectedNew | Where-Object { $safeBlock.Contains($_) }).Count -eq 3) 'FIX126 regression test and historical docs remain safe tooling paths'
Add-Check ($currentBlock.Contains('CHECK_FIX126_SOURCE_GATE_EXIT_CODE.ps1') -and -not $currentBlock.Contains('FIX126_RELEASE_NOTES.txt') -and -not $currentBlock.Contains('FIX126_MODULE_MAP.txt')) 'Only the FIX126 test changed in this package; its historical docs remain unchanged'
Add-Check ($cmd.Contains('call :run_ps_check "CHECK_FIX126_SOURCE_GATE_EXIT_CODE.ps1"')) 'FIX126 regression is part of the active source gate'
$failed = @($checks | Where-Object { -not $_.Passed })
foreach ($check in $checks) { if ($check.Passed) { Write-Host ('[PASS] ' + $check.Name) } else { Write-Host ('[FAIL] ' + $check.Name) } }
if ($failed.Count) { Write-Host ('[FAIL] FIX126 source-gate exit-code regression: ' + (($failed | ForEach-Object { $_.Name }) -join '; ')); exit 1 }
Write-Host ('[PASS] FIX126 source-gate exit-code regression checks: {0}/{0}' -f $checks.Count)
exit 0
