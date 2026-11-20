$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$cmdPath = Join-Path $root 'CHECK_SOURCE.cmd'
$cmd = Get-Content -LiteralPath $cmdPath -Raw -Encoding UTF8
$cmd = $cmd.Replace("`r`n","`n")
$fix128Path = Join-Path $root 'CHECK_FIX128_INTERACTIVE_INSTALL_CONSENT.ps1'
$fix129Path = Join-Path $root 'CHECK_FIX129_CONFIG_PERSISTENCE.ps1'
$fix128 = Get-Content -LiteralPath $fix128Path -Raw -Encoding UTF8
$fix129 = Get-Content -LiteralPath $fix129Path -Raw -Encoding UTF8
$launcher = Get-Content -LiteralPath (Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd') -Raw -Encoding UTF8
$worker = Get-Content -LiteralPath (Join-Path $root 'KCS_FIX101_WORKER.cmd') -Raw -Encoding UTF8
$validator = Get-Content -LiteralPath (Join-Path $root 'VALIDATE_FIX100_PACKAGE.ps1') -Raw -Encoding UTF8
$allow = @(Get-Content -LiteralPath (Join-Path $root 'FIX099_SOURCE_ALLOWLIST.txt') -Encoding UTF8 | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$policy = Get-Content -LiteralPath (Join-Path $root 'CHECK_FIX119_PUBLISHED_RELEASE_PRESERVATION.ps1') -Raw -Encoding UTF8
$safeBlock = [regex]::Match($policy,'\$safePaths\s*=\s*@\((.*?)\)',[Text.RegularExpressions.RegexOptions]::Singleline).Groups[1].Value
$currentBlock = [regex]::Match($policy,'\$currentTagChanges\s*=\s*@\((.*?)\)',[Text.RegularExpressions.RegexOptions]::Singleline).Groups[1].Value
$checks = @()
function Add-Check { param([bool]$Passed,[string]$Name); $script:checks += [pscustomobject]@{Passed=$Passed;Name=$Name} }
function Get-ActiveFixIdentity([string]$SourceGate) {
    $match = [regex]::Match($SourceGate,'(?m)^title\s+KOMPUTEROWE CENTRUM SERWISU\s+(FIX\d{3})\b')
    if (-not $match.Success) { return $null }
    return $match.Groups[1].Value
}
function Get-ReportFixIdentity([string]$SourceGate) {
    $match = [regex]::Match($SourceGate,'(?m)^set "KCS_CHECK_LOG=%~dp0dist\\build-logs\\CHECK_SOURCE_(FIX\d{3})\.log"\r?$')
    if (-not $match.Success) { return $null }
    return $match.Groups[1].Value
}
$activeFix = Get-ActiveFixIdentity $cmd
$reportFix = Get-ReportFixIdentity $cmd
Add-Check ([bool]$activeFix -and $activeFix -match '^FIX\d{3}$') 'Source gate declares a single three-digit active package identity'
Add-Check ($reportFix -eq $activeFix) 'Persistent source-gate report identity matches the source-gate title'
Add-Check ($worker.Contains($activeFix) -and $launcher.Contains($activeFix)) 'Persistent worker and single launcher use the current package identity'
Add-Check ($cmd.Contains('call :run_ps_check "CHECK_FIX128_INTERACTIVE_INSTALL_CONSENT.ps1"') -and $cmd.Contains('call :run_ps_check "CHECK_FIX129_CONFIG_PERSISTENCE.ps1"')) 'Both historic installer-consent and configuration tests remain active'
foreach ($historical in @(@{Name='FIX128';Text=$fix128},@{Name='FIX129';Text=$fix129})) {
    Add-Check ($historical.Text -notmatch 'CHECK_SOURCE_FIX130\.log|current FIX130 source gate|current FIX130 package') ($historical.Name + ' regression no longer hardcodes the stale FIX130 package identity')
    Add-Check ($historical.Text.Contains('Get-ActiveFixIdentity') -or ($historical.Text.Contains('$activeFixMatch') -and $historical.Text.Contains('$activeLogMatch'))) ($historical.Name + ' regression derives the active identity from CHECK_SOURCE')
}
foreach ($fixtureFix in @('FIX131','FIX132','FIX134','FIX145')) {
    $fixture = "title KOMPUTEROWE CENTRUM SERWISU $fixtureFix - KONTROLA`r`nset `"KCS_CHECK_LOG=%~dp0dist\build-logs\CHECK_SOURCE_$fixtureFix.log`""
    Add-Check ((Get-ActiveFixIdentity $fixture) -eq $fixtureFix -and (Get-ReportFixIdentity $fixture) -eq $fixtureFix) ('Identity resolver accepts matching title/report fixture ' + $fixtureFix)
}
$required = @('CHECK_FIX132_HISTORICAL_TEST_IDENTITY.ps1','FIX132_RELEASE_NOTES.txt','FIX132_MODULE_MAP.txt')
Add-Check (($required | Where-Object { $validator.Contains($_) }).Count -eq 3) 'Full-package validator requires all FIX132 artifacts'
Add-Check (($required | Where-Object { $allow -contains $_ }).Count -eq 3) 'Explicit source allowlist contains all FIX132 artifacts'
Add-Check (($required | Where-Object { $safeBlock.Contains($_) }).Count -eq 3) 'FIX132 regression and docs are safe tooling changes'
Add-Check (($required | Where-Object { $currentBlock.Contains($_) }).Count -eq 3) 'FIX132 files are represented in current release-preservation changes'
Add-Check ($cmd.Contains('call :run_ps_check "CHECK_FIX132_HISTORICAL_TEST_IDENTITY.ps1"')) 'FIX132 historical identity regression is active in CHECK_SOURCE'
$historicalNotes = Get-Content -LiteralPath (Join-Path $root 'FIX132_RELEASE_NOTES.txt') -Raw -Encoding UTF8
Add-Check ($historicalNotes -match 'Wersja produktu pozostaje 1\.0\.0\.72 / FIX072' -and $historicalNotes.Contains('Zmiany dotycza wyłącznie testow i narzedzi pakowania')) 'FIX132 historical notes preserve the original tooling-only product baseline 1.0.0.72 / FIX072'
$failed = @($checks | Where-Object { -not $_.Passed })
foreach ($check in $checks) { if ($check.Passed) { Write-Host ('[PASS] ' + $check.Name) } else { Write-Host ('[FAIL] ' + $check.Name) } }
if ($failed.Count) { Write-Host ('[FAIL] FIX132 historical test identity checks: ' + (($failed | ForEach-Object { $_.Name }) -join '; ')); exit 1 }
Write-Host ('[PASS] FIX132 historical test identity checks: {0}/{0}' -f $checks.Count)
exit 0
