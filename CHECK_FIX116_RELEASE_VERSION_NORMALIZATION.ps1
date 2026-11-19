$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$publisherPath = Join-Path $root 'PUBLISH_GITHUB_RELEASES.ps1'
$generatorPath = Join-Path $root 'GENERATE_UPDATE_MANIFEST.ps1'
$publisher = Get-Content -LiteralPath $publisherPath -Raw
$generator = Get-Content -LiteralPath $generatorPath -Raw
function Get-FileVersionHelperAst {
    param([string]$Path)
    $tokens = $null
    $parseErrors = $null
    $ast = [System.Management.Automation.Language.Parser]::ParseFile($Path,[ref]$tokens,[ref]$parseErrors)
    if ($parseErrors) {
        foreach ($parseError in $parseErrors) { Write-Host ('[FAIL] ' + $Path + ': ' + $parseError.Message) }
        throw 'PowerShell parser rejected a release script.'
    }
    return $ast.Find({ param($node) return ($node -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq 'Assert-ExpectedFileVersion') },$true)
}
$publisherFunction = Get-FileVersionHelperAst -Path $publisherPath
$generatorFunction = Get-FileVersionHelperAst -Path $generatorPath
if ($null -eq $publisherFunction -or $null -eq $generatorFunction) { Write-Host '[FAIL] Shared FileVersion normalization helper is missing.'; exit 1 }
. ([scriptblock]::Create($publisherFunction.Extent.Text))
$checks = @()
$trimmed = Assert-ExpectedFileVersion -RawVersion "1.0.0.69   " -ExpectedVersion '1.0.0.69' -Label 'test installer'
$checks += [pscustomobject]@{Passed=($trimmed -ceq '1.0.0.69');Name='Trailing fixed-width whitespace is normalized before version comparison'}
$tabbed = Assert-ExpectedFileVersion -RawVersion "`t1.0.0.69`r`n" -ExpectedVersion '1.0.0.69' -Label 'test portable'
$checks += [pscustomobject]@{Passed=($tabbed -ceq '1.0.0.69');Name='Leading/trailing whitespace is normalized safely'}
$wrongVersionRejected = $false
try { [void](Assert-ExpectedFileVersion -RawVersion '1.0.0.68' -ExpectedVersion '1.0.0.69' -Label 'test wrong version') }
catch { $wrongVersionRejected = ($_.Exception.Message -match 'expected=\[1\.0\.0\.69\]') }
$checks += [pscustomobject]@{Passed=$wrongVersionRejected;Name='A genuinely different product version remains rejected'}
$malformedRejected = $false
try { [void](Assert-ExpectedFileVersion -RawVersion '1.0.0.69-extra' -ExpectedVersion '1.0.0.69' -Label 'test malformed version') }
catch { $malformedRejected = $true }
$checks += [pscustomobject]@{Passed=$malformedRejected;Name='Malformed version suffix remains rejected'}
$publisherHelperText = (($publisherFunction.Extent.Text -split '\r?\n' | ForEach-Object { $_.TrimStart() }) -join "`n")
$generatorHelperText = (($generatorFunction.Extent.Text -split '\r?\n' | ForEach-Object { $_.TrimStart() }) -join "`n")
$checks += [pscustomobject]@{Passed=($publisherHelperText -ceq $generatorHelperText);Name='Publisher and manifest generator use the same helper implementation'}
$checks += [pscustomobject]@{Passed=($publisher.Contains('$installerVersion=Assert-ExpectedFileVersion -RawVersion $installerVersionRaw') -and $publisher.Contains('$portableVersion=Assert-ExpectedFileVersion -RawVersion $portableVersionRaw'));Name='Installer and portable release validation use normalized FileVersion'}
$checks += [pscustomobject]@{Passed=($generator.Contains('$FileVersion=Assert-ExpectedFileVersion -RawVersion $FileVersionRaw') -and $generator -notmatch '\$FileVersion\s*-ne\s*\$Version');Name='Standalone manifest generator no longer compares raw FileVersion'}
$checks += [pscustomobject]@{Passed=($publisher.Contains('$raw.Trim()') -and $publisher.Contains('characterCodes') -and $generator.Contains('characterCodes'));Name='Raw/normalized values and Unicode diagnostics remain available'}
$failed = $false
foreach ($check in $checks) {
    if ($check.Passed) { Write-Host ('[PASS] ' + $check.Name) }
    else { Write-Host ('[FAIL] ' + $check.Name); $failed = $true }
}
if ($failed) { exit 1 }
Write-Host '[PASS] FIX116 release FileVersion normalization regression: 8/8'
exit 0
