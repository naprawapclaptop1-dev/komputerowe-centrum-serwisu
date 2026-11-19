$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$installerScript = Join-Path $root 'INSTALL_PUBLISHED_BUILD.ps1'
if (-not (Test-Path -LiteralPath $installerScript -PathType Leaf)) {
    Write-Host '[FAIL] INSTALL_PUBLISHED_BUILD.ps1 is missing.'
    exit 1
}

$source = Get-Content -LiteralPath $installerScript -Raw -Encoding UTF8
$tokens = $null
$parseErrors = $null
$ast = [System.Management.Automation.Language.Parser]::ParseFile($installerScript, [ref]$tokens, [ref]$parseErrors)
if ($parseErrors -and $parseErrors.Count -gt 0) {
    foreach ($parseError in $parseErrors) {
        Write-Host ('[FAIL] INSTALL_PUBLISHED_BUILD.ps1:{0} {1}' -f $parseError.Extent.StartLineNumber, $parseError.Message)
    }
    exit 1
}
Write-Host '[PASS] Installation script parses without PowerShell syntax errors.'

$functionAst = $ast.Find({
    param($node)
    $node -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq 'ConvertTo-KcsProductVersion'
}, $true)
if (-not $functionAst) {
    Write-Host '[FAIL] ConvertTo-KcsProductVersion helper is missing.'
    exit 1
}
Invoke-Expression $functionAst.Extent.Text
Write-Host '[PASS] Actual product-version helper was extracted from INSTALL_PUBLISHED_BUILD.ps1.'

$checks = @()
function Add-Check {
    param([bool]$Passed, [string]$Name)
    $script:checks += [pscustomobject]@{ Passed = $Passed; Name = $Name }
}

$normal = ConvertTo-KcsProductVersion -RawVersion '1.0.0.69' -ExpectedVersion '1.0.0.69' -Label 'Test'
Add-Check ($normal -ceq '1.0.0.69') 'Canonical product version remains unchanged'

$fixedWidth = ConvertTo-KcsProductVersion -RawVersion ('1.0.0.69' + (' ' * 16)) -ExpectedVersion '1.0.0.69' -Label 'Test'
Add-Check ($fixedWidth -ceq '1.0.0.69') 'Fixed-width FileVersion trailing spaces are trimmed before comparison'

$surrounded = ConvertTo-KcsProductVersion -RawVersion ("`t 1.0.0.69 `t") -ExpectedVersion '1.0.0.69' -Label 'Test'
Add-Check ($surrounded -ceq '1.0.0.69') 'Leading/trailing whitespace is normalized safely'

$unicodeSpace = [string][char]0x00A0 + '1.0.0.69' + [string][char]0x00A0
$unicode = ConvertTo-KcsProductVersion -RawVersion $unicodeSpace -ExpectedVersion '1.0.0.69' -Label 'Test'
Add-Check ($unicode -ceq '1.0.0.69') 'Unicode whitespace around FileVersion is trimmed'

$wrongRejected = $false
try { ConvertTo-KcsProductVersion -RawVersion '1.0.0.68            ' -ExpectedVersion '1.0.0.69' -Label 'Test' | Out-Null }
catch { $wrongRejected = $true }
Add-Check $wrongRejected 'A genuinely different product version remains rejected after normalization'

$malformedRejected = $false
try { ConvertTo-KcsProductVersion -RawVersion '1.0.0.69-beta' -ExpectedVersion '1.0.0.69' -Label 'Test' | Out-Null }
catch { $malformedRejected = $true }
Add-Check $malformedRejected 'Malformed version suffix remains rejected'

$checkInstallerUse = $source.Contains('$version=ConvertTo-KcsProductVersion -RawVersion $versionRaw')
$checkInstalledUse = $source.Contains('$installed=ConvertTo-KcsProductVersion -RawVersion $installedRaw')
Add-Check ($checkInstallerUse -and $checkInstalledUse) 'Both downloaded installer and installed EXE use the shared normalizer'
Add-Check ($source.Contains('GetVersionInfo($Installer).FileVersion') -and $source.Contains('GetVersionInfo($exe).FileVersion')) 'Raw FileVersion values are retained and normalized explicitly'
Add-Check ($source.Contains('wrong FileVersion; raw=') -and $source.Contains('invalid FileVersion; raw=')) 'Mismatch diagnostics include raw and normalized version values'

$failed = @($checks | Where-Object { -not $_.Passed })
foreach ($check in $checks) {
    if ($check.Passed) { Write-Host ('[PASS] ' + $check.Name) }
    else { Write-Host ('[FAIL] ' + $check.Name) }
}
if ($failed.Count -gt 0) {
    Write-Host ('[FAIL] FIX122 install FileVersion normalization regression: ' + (($failed | ForEach-Object { $_.Name }) -join '; '))
    exit 1
}
Write-Host ('[PASS] FIX122 install FileVersion normalization checks: ' + $checks.Count + '/' + $checks.Count)
exit 0
