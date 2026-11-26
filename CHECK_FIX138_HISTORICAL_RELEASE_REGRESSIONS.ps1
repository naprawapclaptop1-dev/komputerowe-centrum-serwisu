$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$checks = @()
function Add-Check { param([bool]$Passed,[string]$Name); $script:checks += [pscustomobject]@{Passed=$Passed;Name=$Name} }
function Read-Text([string]$Name) { return [IO.File]::ReadAllText((Join-Path $root $Name),[Text.Encoding]::UTF8) }
$cmd = Read-Text 'CHECK_SOURCE.cmd'
$launcher = Read-Text 'URUCHOM_TYLKO_TEN_PLIK.cmd'
$worker = Read-Text 'KCS_FIX101_WORKER.cmd'
$manifest = (Read-Text 'FIX099_POWERSHELL_MANIFEST.txt').Replace("`r`n","`n")
$versionLines = [IO.File]::ReadAllLines((Join-Path $root 'VERSION.txt'))
$productVersion = if ($versionLines.Count -gt 0) { $versionLines[0].Trim() } else { '' }
$productFix = if ($versionLines.Count -gt 1) { $versionLines[1].Trim() } else { '' }
$activeTitle = [regex]::Match($cmd,'(?m)^title\s+KOMPUTEROWE CENTRUM SERWISU\s+(FIX\d{3})\b')
$activeLog = [regex]::Match($cmd,'(?m)^set "KCS_CHECK_LOG=%~dp0dist\\build-logs\\CHECK_SOURCE_(FIX\d{3})\.log"\r?$')
$policy = Read-Text 'CHECK_FIX119_PUBLISHED_RELEASE_PRESERVATION.ps1'
$safe = [regex]::Match($policy,'\$safePaths\s*=\s*@\((.*?)\)',[Text.RegularExpressions.RegexOptions]::Singleline).Groups[1].Value
$changed = [regex]::Match($policy,'\$currentTagChanges\s*=\s*@\((.*?)\)',[Text.RegularExpressions.RegexOptions]::Singleline).Groups[1].Value
$validator = Read-Text 'VALIDATE_FIX100_PACKAGE.ps1'
$allow = @(Get-Content -LiteralPath (Join-Path $root 'FIX099_SOURCE_ALLOWLIST.txt') | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$required = @('CHECK_FIX138_HISTORICAL_RELEASE_REGRESSIONS.ps1','FIX138_RELEASE_NOTES.txt','FIX138_MODULE_MAP.txt')
Add-Check ($activeTitle.Success -and $activeTitle.Groups[1].Value -eq 'FIX138' -and $activeLog.Success -and $activeLog.Groups[1].Value -eq 'FIX138') 'Active package and detailed report both use FIX138 identity'
Add-Check ($cmd.Contains('echo CHECK_SOURCE FIX138 - %DATE% %TIME%') -and $cmd.Contains('CHECK_SOURCE_FIX138-current.txt')) 'Visible source-gate report header and temporary log use FIX138'
Add-Check ($launcher.Contains('FIX138') -and $worker.Contains('FIX138') -and $worker.Contains('CHECK_SOURCE_FIX138.log')) 'Single launcher and persistent worker match active FIX138 package'
Add-Check ($productVersion -eq '1.0.0.73' -and $productFix -eq 'FIX137') 'Tooling-only FIX138 preserves the immutable Service PRO product release 1.0.0.73 / FIX137'
$installerRunner = Read-Text 'INSTALL_PUBLISHED_BUILD.ps1'
$installerTest = Read-Text 'CHECK_FIX128_INTERACTIVE_INSTALL_CONSENT.ps1'
Add-Check ($installerRunner.Contains(('installation-{0}-inno.log' -f $productFix)) -and $installerTest.Contains('$productFix') -and -not $installerTest.Contains('installation-FIX072-inno.log')) 'Historical FIX128 test follows the current installer log identity instead of stale FIX072'
foreach ($name in @('FIX132_RELEASE_NOTES.txt','FIX133_RELEASE_NOTES.txt','FIX134_RELEASE_NOTES.txt')) {
    $notes = Read-Text $name
    Add-Check ($notes.Contains('1.0.0.72 / FIX072')) ($name + ' preserves the original historical product baseline')
}
foreach ($name in @('CHECK_FIX133_CRLF_IDENTITY_NORMALIZATION.ps1','CHECK_FIX134_RELEASE_POLICY_SYNTAX.ps1','CHECK_FIX135_SOURCE_GATE_EXIT_CAPTURE.ps1','CHECK_FIX136_SOURCE_BUILD_IDENTITY.ps1','CHECK_FIX137_SERVICE_PRO.ps1','CHECK_FIX138_HISTORICAL_RELEASE_REGRESSIONS.ps1')) {
    $scriptText = Read-Text $name
    Add-Check ($scriptText.Contains('.Replace("`r`n","`n")')) ($name + ' normalizes CRLF before manifest line matching')
}
$hashFailures = @()
foreach ($name in @('CHECK_FIX072_REPOSITORY_INPUT.ps1','CHECK_FIX128_INTERACTIVE_INSTALL_CONSENT.ps1','CHECK_FIX132_HISTORICAL_TEST_IDENTITY.ps1','CHECK_FIX133_CRLF_IDENTITY_NORMALIZATION.ps1','CHECK_FIX134_RELEASE_POLICY_SYNTAX.ps1','CHECK_FIX135_SOURCE_GATE_EXIT_CAPTURE.ps1','CHECK_FIX136_SOURCE_BUILD_IDENTITY.ps1','CHECK_FIX137_SERVICE_PRO.ps1','CHECK_FIX138_HISTORICAL_RELEASE_REGRESSIONS.ps1')) {
    $path = Join-Path $root $name
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { $hashFailures += ($name + ' missing'); continue }
    $hash = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash
    if ($manifest -notmatch ('(?m)^' + [regex]::Escape($hash) + '\|' + [regex]::Escape($name) + '$')) { $hashFailures += ($name + ' hash missing or stale') }
}
Add-Check ($hashFailures.Count -eq 0) 'Manifest includes correct SHA-256 hashes for historical and current regression scripts with CRLF-safe matching'
Add-Check ($cmd.Contains('call :run_ps_check "CHECK_FIX138_HISTORICAL_RELEASE_REGRESSIONS.ps1"')) 'FIX138 historical release regression is active in CHECK_SOURCE'
Add-Check (($required | Where-Object { $validator.Contains($_) }).Count -eq 3) 'Full-package validator requires all FIX138 test and documentation files'
Add-Check (($required | Where-Object { $allow -contains $_ }).Count -eq 3) 'Explicit source allowlist includes all FIX138 test and documentation files'
Add-Check (($required | Where-Object { $safe.Contains($_) }).Count -eq 3) 'FIX138 regression and docs are safe tooling/documentation paths'
Add-Check (($required | Where-Object { $changed.Contains($_) }).Count -eq 3) 'FIX138 artifacts are classified in current release-preservation changes'
$setup = Read-Text 'SETUP_MODERN.iss'
$assembly = Read-Text 'AssemblyInfo.cs'
Add-Check ($setup.Contains('#define MyAppVersion "1.0.0.73"') -and $assembly.Contains('AssemblyFileVersion("1.0.0.73")') -and $assembly.Contains('AssemblyInformationalVersion("FIX137")')) 'Current product setup and assembly metadata remain aligned to FIX137'
$failed = @($checks | Where-Object { -not $_.Passed })
foreach ($check in $checks) { if ($check.Passed) { Write-Host ('[PASS] ' + $check.Name) } else { Write-Host ('[FAIL] ' + $check.Name) } }
if ($failed.Count) { Write-Host ('[FAIL] FIX138 historical release regression checks: ' + (($failed | ForEach-Object { $_.Name }) -join '; ')); exit 1 }
Write-Host ('[PASS] FIX138 historical release regression checks: {0}/{0}' -f $checks.Count)
exit 0
