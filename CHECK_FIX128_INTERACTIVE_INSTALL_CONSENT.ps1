$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$runnerPath = Join-Path $root 'INSTALL_PUBLISHED_BUILD.ps1'
$setupPath = Join-Path $root 'SETUP_MODERN.iss'
$legacyPath = Join-Path $root 'SETUP_LEGACY_XP.iss'
$fix072Path = Join-Path $root 'CHECK_FIX072_UPDATE_ENDPOINTS.ps1'
$tokens = $null
$parseErrors = $null
[System.Management.Automation.Language.Parser]::ParseFile($runnerPath,[ref]$tokens,[ref]$parseErrors) | Out-Null
if ($parseErrors) {
    foreach ($parseError in $parseErrors) { Write-Host ('[FAIL] Installer runner parser: ' + $parseError.Message) }
    exit 1
}
$runner = Get-Content -LiteralPath $runnerPath -Raw -Encoding UTF8
$setup = Get-Content -LiteralPath $setupPath -Raw -Encoding UTF8
$legacy = Get-Content -LiteralPath $legacyPath -Raw -Encoding UTF8
$fix072 = Get-Content -LiteralPath $fix072Path -Raw -Encoding UTF8
$checks = @()
function Add-Check { param([bool]$Passed,[string]$Name); $script:checks += [pscustomobject]@{Passed=$Passed;Name=$Name} }
$expectedArgs = "-ArgumentList @('/NORESTART','/SP-'," + '$logArgument' + ")"
Add-Check ($runner.Contains($expectedArgs)) 'Install runner launches Inno Setup without suppressing its wizard'
Add-Check ($runner -notmatch '(?i)/VERYSILENT|/SILENT|/SUPPRESSMSGBOXES') 'No silent or message-suppression switch can bypass the acknowledgement page'
Add-Check ($runner.Contains("'-Verb RunAs'") -or $runner.Contains('-Verb RunAs')) 'Installer still requests elevation'
Add-Check ($runner.Contains('-Wait -PassThru')) 'Automation waits for the real installer process and exit code'
Add-Check ($runner.Contains('/LOG=') -and $runner.Contains('installation-FIX071-inno.log')) 'Dedicated Inno Setup diagnostic log remains enabled'
Add-Check ($runner.Contains('samodzielnie zaznacz pole akceptacji ryzyka')) 'Console explains that consent must be given by the user'
Add-Check ($runner.Contains('if($p.ExitCode -ne 0)') -and $runner.Contains('Installation was cancelled during installation.')) 'Nonzero and cancellation exit codes are not reported as successful'
foreach ($installer in @($setup,$legacy)) {
    Add-Check ($installer.Contains('RiskCheck.Checked := False')) 'Risk consent checkbox defaults to unchecked'
    Add-Check ($installer.Contains('if not RiskCheck.Checked')) 'Installer blocks interactive continuation until consent is checked'
    Add-Check ($installer.Contains('zapozna') -or $installer.Contains('Zaznacz') -or $installer.Contains('zaznacz')) 'Installer retains Polish risk acknowledgement wording'
}
Add-Check ($fix072.Contains("-notmatch '/VERYSILENT|/SILENT|/SUPPRESSMSGBOXES'") -and $fix072.Contains('launched interactively')) 'Historical FIX072 endpoint regression now expects the guided installer path'
$cmd = Get-Content -LiteralPath (Join-Path $root 'CHECK_SOURCE.cmd') -Raw -Encoding UTF8
$validator = Get-Content -LiteralPath (Join-Path $root 'VALIDATE_FIX100_PACKAGE.ps1') -Raw -Encoding UTF8
$allow = @(Get-Content -LiteralPath (Join-Path $root 'FIX099_SOURCE_ALLOWLIST.txt') -Encoding UTF8 | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$policy = Get-Content -LiteralPath (Join-Path $root 'CHECK_FIX119_PUBLISHED_RELEASE_PRESERVATION.ps1') -Raw -Encoding UTF8
$safeBlock = [regex]::Match($policy,'\$safePaths\s*=\s*@\((.*?)\)',[Text.RegularExpressions.RegexOptions]::Singleline).Groups[1].Value
$currentBlock = [regex]::Match($policy,'\$currentTagChanges\s*=\s*@\((.*?)\)',[Text.RegularExpressions.RegexOptions]::Singleline).Groups[1].Value
$required = @('CHECK_FIX128_INTERACTIVE_INSTALL_CONSENT.ps1','FIX128_RELEASE_NOTES.txt','FIX128_MODULE_MAP.txt')
Add-Check ($cmd.Contains('call :run_ps_check "CHECK_FIX128_INTERACTIVE_INSTALL_CONSENT.ps1"')) 'FIX128 installer-consent test is active in CHECK_SOURCE'
Add-Check (($required | Where-Object { $validator.Contains($_) }).Count -eq 3) 'Full package validator requires all FIX128 artifacts'
Add-Check (($required | Where-Object { $allow -contains $_ }).Count -eq 3) 'Explicit source allowlist contains all FIX128 artifacts'
Add-Check (($required | Where-Object { $safeBlock.Contains($_) -and $currentBlock.Contains($_) }).Count -eq 3) 'FIX128 test and documentation are allowed safe tooling changes'
Add-Check ($safeBlock.Contains('CHECK_FIX072_UPDATE_ENDPOINTS.ps1') -and $currentBlock.Contains('CHECK_FIX072_UPDATE_ENDPOINTS.ps1')) 'Updated historical installer regression remains eligible as safe test tooling'
Add-Check ($safeBlock.Contains('INSTALL_PUBLISHED_BUILD.ps1') -and $currentBlock.Contains('INSTALL_PUBLISHED_BUILD.ps1')) 'Install runner remains eligible as safe packaging tooling'
Add-Check ($cmd.Contains('FIX129') -and $cmd.Contains('CHECK_SOURCE_FIX129.log')) 'CHECK_SOURCE uses current FIX129 package and report identity'
$failed = @($checks | Where-Object { -not $_.Passed })
foreach ($check in $checks) { if ($check.Passed) { Write-Host ('[PASS] ' + $check.Name) } else { Write-Host ('[FAIL] ' + $check.Name) } }
if ($failed.Count) { Write-Host ('[FAIL] FIX128 interactive installer consent checks: ' + (($failed | ForEach-Object { $_.Name }) -join '; ')); exit 1 }
Write-Host ('[PASS] FIX128 interactive installer consent checks: {0}/{0}' -f $checks.Count)
exit 0
