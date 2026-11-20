$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$workerPath = Join-Path $root 'KCS_FIX101_WORKER.cmd'
$cmdPath = Join-Path $root 'CHECK_SOURCE.cmd'
$validatorPath = Join-Path $root 'VALIDATE_FIX100_PACKAGE.ps1'
$allowlistPath = Join-Path $root 'FIX099_SOURCE_ALLOWLIST.txt'
$policyPath = Join-Path $root 'CHECK_FIX119_PUBLISHED_RELEASE_PRESERVATION.ps1'
$worker = Get-Content -LiteralPath $workerPath -Raw -Encoding UTF8
$cmd = Get-Content -LiteralPath $cmdPath -Raw -Encoding UTF8
$validator = Get-Content -LiteralPath $validatorPath -Raw -Encoding UTF8
$policy = Get-Content -LiteralPath $policyPath -Raw -Encoding UTF8
$allowlist = @(Get-Content -LiteralPath $allowlistPath | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$entry = Get-Content -LiteralPath (Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd') -Raw -Encoding UTF8
$checks = @()
function Add-Check { param([bool]$Passed,[string]$Name); $script:checks += [pscustomobject]@{Passed=$Passed;Name=$Name} }
$validationBlock = [regex]::Match($worker, '(?s):validation_fail\r?\n(.*?)(?=\r?\n:tools_fail)').Groups[1].Value
$safeBlock = [regex]::Match($policy, '\$safePaths\s*=\s*@\((.*?)\)', [Text.RegularExpressions.RegexOptions]::Singleline).Groups[1].Value
$currentBlock = [regex]::Match($policy, '\$currentTagChanges\s*=\s*@\((.*?)\)', [Text.RegularExpressions.RegexOptions]::Singleline).Groups[1].Value
$currentFixMatch = [regex]::Match($cmd, '(?im)^title\s+.*?(?<fix>FIX\d{3})')
$currentFix = $currentFixMatch.Groups['fix'].Value
$reportName = 'CHECK_SOURCE_' + $currentFix + '.log'
$reportOutputName = 'CHECK_SOURCE_' + $currentFix + '-current.txt'
$expectedNew = @('CHECK_FIX125_DIAGNOSTICS_PROPAGATION.ps1','FIX125_RELEASE_NOTES.txt','FIX125_MODULE_MAP.txt')
Add-Check ($currentFixMatch.Success -and $cmd.Contains($reportName) -and $cmd.Contains($reportOutputName)) 'CHECK_SOURCE writes a uniquely versioned persistent FIX125 report'
Add-Check ($validationBlock.Contains($reportName)) 'Persistent worker reads the detailed source-gate report on CHECK_SOURCE failure'
Add-Check ($validationBlock.Contains(('type "%LOGDIR%\' + $reportName + '"'))) 'Persistent worker displays the detailed report in the active CMD window'
Add-Check ($validationBlock.Contains(('type "%LOGDIR%\' + $reportName + '" >>"%LOG%"'))) 'Persistent worker appends the detailed report to the main automatic-start log'
Add-Check ($validationBlock.Contains(('if exist "%LOGDIR%\' + $reportName + '"')) -and $validationBlock.Contains(('[WARN] Brak pliku ' + $reportName))) 'Missing detailed report is explicitly diagnosed without hiding the original failure'
Add-Check ($cmd.Contains('call :run_ps_check "CHECK_FIX125_DIAGNOSTICS_PROPAGATION.ps1"')) 'FIX125 regression test is part of the active source gate'
Add-Check ($cmd.Contains('CHECK_FIX125_DIAGNOSTICS_PROPAGATION.ps1 FIX125_RELEASE_NOTES.txt FIX125_MODULE_MAP.txt')) 'CHECK_SOURCE requires the FIX125 test and documentation'
Add-Check (($expectedNew | Where-Object { $validator.Contains($_) }).Count -eq 3) 'Full-package validator requires all FIX125 artifacts'
Add-Check (($expectedNew | Where-Object { $allowlist -contains $_ }).Count -eq 3) 'Source synchronization allowlist contains all FIX125 artifacts'
Add-Check (($expectedNew | Where-Object { $safeBlock.Contains($_) }).Count -eq 3) 'FIX125 test and historical docs remain classified as safe tooling paths'
Add-Check ($currentBlock.Contains('CHECK_FIX125_DIAGNOSTICS_PROPAGATION.ps1') -and -not $currentBlock.Contains('FIX125_RELEASE_NOTES.txt') -and -not $currentBlock.Contains('FIX125_MODULE_MAP.txt')) 'Only the FIX125 test changed in this package; its historical docs remain unchanged'
Add-Check ($safeBlock.Contains('KCS_FIX101_WORKER.cmd') -and $safeBlock.Contains('URUCHOM_TYLKO_TEN_PLIK.cmd') -and $currentBlock.Contains('KCS_FIX101_WORKER.cmd') -and $currentBlock.Contains('URUCHOM_TYLKO_TEN_PLIK.cmd')) 'Worker and single launcher remain explicitly classified as packaging tooling'
Add-Check ($currentFixMatch.Success -and $worker.Contains($currentFix) -and $entry.Contains($currentFix) -and $cmd.Contains($currentFix)) 'Worker, launcher and source gate use the same FIX125 package identity'
Add-Check ($cmd.Contains('CHECK_FIX124_SOURCE_GATE_DIAGNOSTICS.ps1') -and $cmd.Contains('CHECK_FIX123_INSTALLER_INITIALIZATION.ps1')) 'All previous active FIX123/FIX124 diagnostic tests remain enabled'
$bytes = [IO.File]::ReadAllBytes($cmdPath)
Add-Check ($bytes.Length -gt 0 -and $bytes[0] -eq 64 -and $bytes[0] -ne 239) 'CHECK_SOURCE remains BOM-free for cmd.exe'
$failed = @($checks | Where-Object { -not $_.Passed })
foreach ($check in $checks) { if ($check.Passed) { Write-Host ('[PASS] ' + $check.Name) } else { Write-Host ('[FAIL] ' + $check.Name) } }
if ($failed.Count) { Write-Host ('[FAIL] FIX125 diagnostics propagation checks: ' + (($failed | ForEach-Object { $_.Name }) -join '; ')); exit 1 }
Write-Host ("[PASS] FIX125 diagnostics propagation checks: {0}/{0}" -f $checks.Count)
exit 0
