$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$checks = @()
function Add-Check { param([bool]$Passed,[string]$Name); $script:checks += [pscustomobject]@{Passed=$Passed;Name=$Name} }
$policyPath = Join-Path $root 'CHECK_FIX119_PUBLISHED_RELEASE_PRESERVATION.ps1'
$policy = Get-Content -LiteralPath $policyPath -Raw -Encoding UTF8
$tokens = $null
$parseErrors = $null
[void][System.Management.Automation.Language.Parser]::ParseFile($policyPath, [ref]$tokens, [ref]$parseErrors)
Add-Check ($parseErrors.Count -eq 0) 'CHECK_FIX119_PUBLISHED_RELEASE_PRESERVATION.ps1 parses without PowerShell syntax errors'
foreach ($arrayName in @('safePaths','currentTagChanges')) {
    $arrayMatch = [regex]::Match($policy, ('(?s)\${0}\s*=\s*@\((.*?)\)' -f [regex]::Escape($arrayName)))
    Add-Check ($arrayMatch.Success) ($arrayName + ' array exists in release-preservation policy')
    if ($arrayMatch.Success) {
        Add-Check ($arrayMatch.Groups[1].Value -notmatch ',\s*$') ($arrayName + ' array has no trailing comma before its closing parenthesis')
    } else {
        Add-Check $false ($arrayName + ' array content can be inspected')
    }
}
$sourceGate = Get-Content -LiteralPath (Join-Path $root 'CHECK_SOURCE.cmd') -Raw -Encoding UTF8
$sourceGate = $sourceGate.Replace("`r`n","`n")
$validator = Get-Content -LiteralPath (Join-Path $root 'VALIDATE_FIX100_PACKAGE.ps1') -Raw -Encoding UTF8
$allow = @(Get-Content -LiteralPath (Join-Path $root 'FIX099_SOURCE_ALLOWLIST.txt') -Encoding UTF8 | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$manifest = Get-Content -LiteralPath (Join-Path $root 'FIX099_POWERSHELL_MANIFEST.txt') -Raw -Encoding UTF8
$safeBlock = [regex]::Match($policy,'\$safePaths\s*=\s*@\((.*?)\)',[Text.RegularExpressions.RegexOptions]::Singleline).Groups[1].Value
$currentBlock = [regex]::Match($policy,'\$currentTagChanges\s*=\s*@\((.*?)\)',[Text.RegularExpressions.RegexOptions]::Singleline).Groups[1].Value
$required = @('CHECK_FIX134_RELEASE_POLICY_SYNTAX.ps1','FIX134_RELEASE_NOTES.txt','FIX134_MODULE_MAP.txt')
Add-Check ($sourceGate.Contains('call :run_ps_check "CHECK_FIX134_RELEASE_POLICY_SYNTAX.ps1"')) 'FIX134 parser regression is active in CHECK_SOURCE'
Add-Check (($required | Where-Object { $sourceGate.Contains($_) }).Count -eq 3) 'CHECK_SOURCE requires all FIX134 test and documentation files'
Add-Check (($required | Where-Object { $validator.Contains($_) }).Count -eq 3) 'Full-package validator requires all FIX134 artifacts'
Add-Check (($required | Where-Object { $allow -contains $_ }).Count -eq 3) 'Explicit source allowlist contains all FIX134 artifacts'
Add-Check (($required | Where-Object { $safeBlock.Contains($_) }).Count -eq 3) 'FIX134 test and docs are safe tooling paths'
Add-Check (($required | Where-Object { $currentBlock.Contains($_) }).Count -eq 3) 'FIX134 artifacts are present in release-preservation changed paths'
Add-Check (($manifest -match '(?m)^[0-9A-F]{64}\|CHECK_FIX134_RELEASE_POLICY_SYNTAX\.ps1$')) 'PowerShell manifest contains the FIX134 parser regression hash'
$version = (Get-Content -LiteralPath (Join-Path $root 'VERSION.txt') -Encoding UTF8 | Select-Object -First 1).Trim()
Add-Check ($version -eq '1.0.0.72') 'Product version remains unchanged for tooling-only FIX134'
$failed = @($checks | Where-Object { -not $_.Passed })
foreach ($check in $checks) { if ($check.Passed) { Write-Host ('[PASS] ' + $check.Name) } else { Write-Host ('[FAIL] ' + $check.Name) } }
if ($failed.Count) { Write-Host ('[FAIL] FIX134 release-policy syntax checks: ' + (($failed | ForEach-Object { $_.Name }) -join '; ')); exit 1 }
Write-Host ('[PASS] FIX134 release-policy syntax checks: {0}/{0}' -f $checks.Count)
exit 0
