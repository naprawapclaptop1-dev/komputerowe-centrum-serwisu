$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$cmdPath = Join-Path $root 'CHECK_SOURCE.cmd'
$entryPath = Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd'
$workerPath = Join-Path $root 'KCS_FIX101_WORKER.cmd'
$validatorPath = Join-Path $root 'VALIDATE_FIX100_PACKAGE.ps1'
$policyPath = Join-Path $root 'CHECK_FIX119_PUBLISHED_RELEASE_PRESERVATION.ps1'
$allowPath = Join-Path $root 'FIX099_SOURCE_ALLOWLIST.txt'
$manifestPath = Join-Path $root 'FIX099_POWERSHELL_MANIFEST.txt'
$cmd = [IO.File]::ReadAllText($cmdPath, [Text.Encoding]::UTF8).Replace("`r`n", "`n")
$entry = [IO.File]::ReadAllText($entryPath, [Text.Encoding]::UTF8)
$worker = [IO.File]::ReadAllText($workerPath, [Text.Encoding]::UTF8)
$validator = Get-Content -LiteralPath $validatorPath -Raw -Encoding UTF8
$policy = Get-Content -LiteralPath $policyPath -Raw -Encoding UTF8
$allow = @(Get-Content -LiteralPath $allowPath -Encoding UTF8 | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$manifest = (Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8).Replace("`r`n","`n")
$checks = @()
function Add-Check { param([bool]$Passed,[string]$Name); $script:checks += [pscustomobject]@{Passed=$Passed;Name=$Name} }
$currentFixMatch = [regex]::Match($cmd, '(?im)^title\s+.*?(?<fix>FIX\d{3})')
$currentFix = $currentFixMatch.Groups['fix'].Value
$reportName = 'CHECK_SOURCE_' + $currentFix + '.log'
$reportTempName = 'CHECK_SOURCE_' + $currentFix + '-current.txt'
$runnerPattern = '(?s)powershell\.exe[^\r\n]*-File "%~dp0%~1"[^\r\n]*>"%KCS_TEST_OUTPUT%" 2>&1\nset "KCS_TEST_RC=%ERRORLEVEL%"'
$safeBlock = [regex]::Match($policy, '\$safePaths\s*=\s*@\((.*?)\)', [Text.RegularExpressions.RegexOptions]::Singleline).Groups[1].Value
$currentBlock = [regex]::Match($policy, '\$currentTagChanges\s*=\s*@\((.*?)\)', [Text.RegularExpressions.RegexOptions]::Singleline).Groups[1].Value
$required = @('CHECK_FIX135_SOURCE_GATE_EXIT_CAPTURE.ps1','FIX135_RELEASE_NOTES.txt','FIX135_MODULE_MAP.txt')
Add-Check ($currentFixMatch.Success -and $currentFix -match '^FIX\d{3}$') 'CHECK_SOURCE declares one valid active three-digit package identity'
Add-Check ($cmd.StartsWith('@echo off') -and $cmd.Contains($reportName) -and $cmd.Contains($reportTempName)) 'Source gate is BOM-free CMD and uses report identities matching the active package'
Add-Check ([regex]::IsMatch($cmd, $runnerPattern)) 'PowerShell child exit code is captured on the immediately following command line'
Add-Check ($cmd.Contains('if "%KCS_TEST_RC%"=="0" goto :run_ps_check_pass') -and $cmd.Contains('set "KCS_CHECK_FAILED=1"')) 'PASS and FAIL handling remain explicit and independent'
Add-Check ($cmd.Contains('call :run_ps_check "CHECK_FIX126_SOURCE_GATE_EXIT_CODE.ps1"') -and $cmd.Contains('call :run_ps_check "CHECK_FIX135_SOURCE_GATE_EXIT_CAPTURE.ps1"')) 'Historical FIX126 and new FIX135 regressions both remain active'
Add-Check ($entry.Contains($currentFix) -and $worker.Contains($currentFix) -and $worker.Contains($reportName)) 'Launcher, worker and detailed report share the active package identity'
Add-Check (($required | Where-Object { $validator.Contains($_) }).Count -eq 3) 'Full-package validator requires all FIX135 artifacts'
Add-Check (($required | Where-Object { $allow -contains $_ }).Count -eq 3) 'Explicit source allowlist includes all FIX135 artifacts'
Add-Check (($required | Where-Object { $safeBlock.Contains($_) }).Count -eq 3) 'FIX135 regression and docs are safe tooling paths'
Add-Check (($required | Where-Object { $currentBlock.Contains($_) }).Count -eq 3) 'FIX135 artifacts are represented in current release-preservation changes'
Add-Check ($manifest -match '(?m)^[0-9A-F]{64}\|CHECK_FIX135_SOURCE_GATE_EXIT_CAPTURE\.ps1$') 'PowerShell manifest contains the FIX135 regression hash'
$version = (Get-Content -LiteralPath (Join-Path $root 'VERSION.txt') -Encoding UTF8 | Select-Object -First 1).Trim()
Add-Check ($version -eq '1.0.0.73') 'New service application release is 1.0.0.73 / FIX137'
$bytes = [IO.File]::ReadAllBytes($cmdPath)
Add-Check ($bytes.Length -gt 0 -and $bytes[0] -eq 64 -and ([Text.Encoding]::UTF8.GetString($bytes) -notmatch '(?m)^powershell\.exe[^\r\n]*-File "%~dp0%~1"[^\r\n]*>"%KCS_TEST_OUTPUT%" 2>&1\r?\n\r?\nset "KCS_TEST_RC=')) 'No empty command row separates PowerShell execution from ERRORLEVEL capture'
$failed = @($checks | Where-Object { -not $_.Passed })
foreach ($check in $checks) { if ($check.Passed) { Write-Host ('[PASS] ' + $check.Name) } else { Write-Host ('[FAIL] ' + $check.Name) } }
if ($failed.Count) { Write-Host ('[FAIL] FIX135 exit-code capture checks: ' + (($failed | ForEach-Object { $_.Name }) -join '; ')); exit 1 }
Write-Host ('[PASS] FIX135 immediate exit-code capture checks: {0}/{0}' -f $checks.Count)
exit 0
