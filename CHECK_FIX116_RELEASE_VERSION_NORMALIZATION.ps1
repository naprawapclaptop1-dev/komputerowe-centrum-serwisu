$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$publisherPath = Join-Path $root 'PUBLISH_GITHUB_RELEASES.ps1'
$generatorPath = Join-Path $root 'GENERATE_UPDATE_MANIFEST.ps1'
$publisher = Get-Content -LiteralPath $publisherPath -Raw
$generator = Get-Content -LiteralPath $generatorPath -Raw
function Get-PublisherProductVersion {
    param([string]$PublisherText)
    # The release publisher declares $Version inside a try block; allow indentation
    # but only match a complete four-part product version assignment line.
    $versionMatch = [regex]::Match($PublisherText, '(?m)^[ \t]*\$Version[ \t]*=[ \t]*"(?<version>\d+\.\d+\.\d+\.\d+)"')
    if (-not $versionMatch.Success) { throw 'Publisher product version could not be resolved for the regression test.' }
    return $versionMatch.Groups['version'].Value
}
$expectedProductVersion = Get-PublisherProductVersion -PublisherText $publisher
$versionParts = [version]$expectedProductVersion
$wrongProductVersion = '{0}.{1}.{2}.{3}' -f $versionParts.Major,$versionParts.Minor,$versionParts.Build,([Math]::Max(0,$versionParts.Revision - 1))
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
$trimmed = Assert-ExpectedFileVersion -RawVersion ($expectedProductVersion + "   ") -ExpectedVersion $expectedProductVersion -Label 'test installer'
$checks += [pscustomobject]@{Passed=($trimmed -ceq $expectedProductVersion);Name='Trailing fixed-width whitespace is normalized before version comparison'}
$tabbed = Assert-ExpectedFileVersion -RawVersion ("`t" + $expectedProductVersion + "`r`n") -ExpectedVersion $expectedProductVersion -Label 'test portable'
$checks += [pscustomobject]@{Passed=($tabbed -ceq $expectedProductVersion);Name='Leading/trailing whitespace is normalized safely'}
$wrongVersionRejected = $false
try { [void](Assert-ExpectedFileVersion -RawVersion $wrongProductVersion -ExpectedVersion $expectedProductVersion -Label 'test wrong version') }
catch { $wrongVersionRejected = ($_.Exception.Message.Contains(('expected=[' + $expectedProductVersion + ']'))) }
$checks += [pscustomobject]@{Passed=$wrongVersionRejected;Name='A genuinely different product version remains rejected'}
$malformedRejected = $false
try { [void](Assert-ExpectedFileVersion -RawVersion ($expectedProductVersion + '-extra') -ExpectedVersion $expectedProductVersion -Label 'test malformed version') }
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
