$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$checks = @()
function Add-Check { param([bool]$Passed,[string]$Name); $script:checks += [pscustomobject]@{Passed=$Passed;Name=$Name} }
function Normalize-SourceGateText([string]$Text) { return $Text.Replace("`r`n","`n") }
function Get-ActiveFixIdentity([string]$SourceGate) {
    $normalized = Normalize-SourceGateText $SourceGate
    $match = [regex]::Match($normalized,'(?m)^title\s+KOMPUTEROWE CENTRUM SERWISU\s+(FIX\d{3})\b')
    if (-not $match.Success) { return $null }
    return $match.Groups[1].Value
}
function Get-ReportFixIdentity([string]$SourceGate) {
    $normalized = Normalize-SourceGateText $SourceGate
    $match = [regex]::Match($normalized,'(?m)^set "KCS_CHECK_LOG=%~dp0dist\\build-logs\\CHECK_SOURCE_(FIX\d{3})\.log"\r?$')
    if (-not $match.Success) { return $null }
    return $match.Groups[1].Value
}
$cmdPath = Join-Path $root 'CHECK_SOURCE.cmd'
$cmdRaw = Get-Content -LiteralPath $cmdPath -Raw -Encoding UTF8
$cmd = Normalize-SourceGateText $cmdRaw
$fix128 = Get-Content -LiteralPath (Join-Path $root 'CHECK_FIX128_INTERACTIVE_INSTALL_CONSENT.ps1') -Raw -Encoding UTF8
$fix129 = Get-Content -LiteralPath (Join-Path $root 'CHECK_FIX129_CONFIG_PERSISTENCE.ps1') -Raw -Encoding UTF8
$fix132 = Get-Content -LiteralPath (Join-Path $root 'CHECK_FIX132_HISTORICAL_TEST_IDENTITY.ps1') -Raw -Encoding UTF8
$activeFix = Get-ActiveFixIdentity $cmdRaw
$reportFix = Get-ReportFixIdentity $cmdRaw
Add-Check ($activeFix -match '^FIX\d{3}$') 'Current source-gate title resolves a three-digit package identity from CRLF source'
Add-Check ($reportFix -eq $activeFix) 'Persistent report identity matches the active title from CRLF source'
$fixture = "title KOMPUTEROWE CENTRUM SERWISU FIX145 - CHECK`r`nset `"KCS_CHECK_LOG=%~dp0dist\build-logs\CHECK_SOURCE_FIX145.log`"`r`n"
Add-Check ((Get-ActiveFixIdentity $fixture) -eq 'FIX145' -and (Get-ReportFixIdentity $fixture) -eq 'FIX145') 'CRLF title and report fixtures resolve the same identity'
$lfFixture = "title KOMPUTEROWE CENTRUM SERWISU FIX146 - CHECK`nset `"KCS_CHECK_LOG=%~dp0dist\build-logs\CHECK_SOURCE_FIX146.log`"`n"
Add-Check ((Get-ActiveFixIdentity $lfFixture) -eq 'FIX146' -and (Get-ReportFixIdentity $lfFixture) -eq 'FIX146') 'LF title and report fixtures remain supported'
foreach ($entry in @(@{Name='FIX128';Text=$fix128},@{Name='FIX129';Text=$fix129},@{Name='FIX132';Text=$fix132})) {
    Add-Check ($entry.Text.Contains('$cmd = $cmd.Replace("`r`n","`n")')) ($entry.Name + ' historical test normalizes CRLF before anchored regex matching')
}
Add-Check ($cmd.Contains('call :run_ps_check "CHECK_FIX128_INTERACTIVE_INSTALL_CONSENT.ps1"') -and $cmd.Contains('call :run_ps_check "CHECK_FIX129_CONFIG_PERSISTENCE.ps1"') -and $cmd.Contains('call :run_ps_check "CHECK_FIX132_HISTORICAL_TEST_IDENTITY.ps1"')) 'All historical identity-sensitive regressions remain active'
Add-Check ($cmd.Contains('call :run_ps_check "CHECK_FIX133_CRLF_IDENTITY_NORMALIZATION.ps1"')) 'FIX133 newline normalization regression is active in CHECK_SOURCE'
$validator = Get-Content -LiteralPath (Join-Path $root 'VALIDATE_FIX100_PACKAGE.ps1') -Raw -Encoding UTF8
$allow = @(Get-Content -LiteralPath (Join-Path $root 'FIX099_SOURCE_ALLOWLIST.txt') -Encoding UTF8 | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$manifest = Get-Content -LiteralPath (Join-Path $root 'FIX099_POWERSHELL_MANIFEST.txt') -Raw -Encoding UTF8
$policy = Get-Content -LiteralPath (Join-Path $root 'CHECK_FIX119_PUBLISHED_RELEASE_PRESERVATION.ps1') -Raw -Encoding UTF8
$safeBlock = [regex]::Match($policy,'\$safePaths\s*=\s*@\((.*?)\)',[Text.RegularExpressions.RegexOptions]::Singleline).Groups[1].Value
$currentBlock = [regex]::Match($policy,'\$currentTagChanges\s*=\s*@\((.*?)\)',[Text.RegularExpressions.RegexOptions]::Singleline).Groups[1].Value
$required = @('CHECK_FIX133_CRLF_IDENTITY_NORMALIZATION.ps1','FIX133_RELEASE_NOTES.txt','FIX133_MODULE_MAP.txt')
Add-Check (($required | Where-Object { $validator.Contains($_) }).Count -eq 3) 'Full package validator requires all FIX133 artifacts'
Add-Check (($required | Where-Object { $allow -contains $_ }).Count -eq 3) 'Explicit source allowlist contains all FIX133 artifacts'
Add-Check (($required | Where-Object { $safeBlock.Contains($_) }).Count -eq 3) 'FIX133 test and docs are classified as safe tooling changes'
Add-Check (($required | Where-Object { $currentBlock.Contains($_) }).Count -eq 3) 'FIX133 artifacts are included in current release-preservation changes'
Add-Check (($manifest -match '(?m)^[0-9A-F]{64}\|CHECK_FIX133_CRLF_IDENTITY_NORMALIZATION\.ps1$')) 'PowerShell manifest contains the FIX133 regression hash'
$version = (Get-Content -LiteralPath (Join-Path $root 'VERSION.txt') -Encoding UTF8 | Select-Object -First 1).Trim()
Add-Check ($version -eq '1.0.0.72') 'Product version remains unchanged for tooling-only FIX133'
$failed = @($checks | Where-Object { -not $_.Passed })
foreach ($check in $checks) { if ($check.Passed) { Write-Host ('[PASS] ' + $check.Name) } else { Write-Host ('[FAIL] ' + $check.Name) } }
if ($failed.Count) { Write-Host ('[FAIL] FIX133 CRLF identity checks: ' + (($failed | ForEach-Object { $_.Name }) -join '; ')); exit 1 }
Write-Host ('[PASS] FIX133 CRLF identity normalization checks: {0}/{0}' -f $checks.Count)
exit 0
