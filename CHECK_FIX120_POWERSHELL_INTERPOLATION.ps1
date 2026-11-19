$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$publisherPath = Join-Path $root 'PUBLISH_GITHUB_RELEASES.ps1'
if (-not (Test-Path -LiteralPath $publisherPath -PathType Leaf)) {
    Write-Host '[FAIL] PUBLISH_GITHUB_RELEASES.ps1 is missing.'
    exit 1
}
$source = Get-Content -LiteralPath $publisherPath -Raw -Encoding UTF8
$tokens = $null
$parseErrors = $null
[System.Management.Automation.Language.Parser]::ParseFile($publisherPath, [ref]$tokens, [ref]$parseErrors) | Out-Null
if ($parseErrors -and $parseErrors.Count -gt 0) {
    foreach ($parseError in $parseErrors) {
        Write-Host ('[FAIL] PUBLISH_GITHUB_RELEASES.ps1:{0} {1}' -f $parseError.Extent.StartLineNumber, $parseError.Message)
    }
    exit 1
}
Write-Host '[PASS] Release publisher parses without PowerShell syntax errors.'

if ($source.Contains('$Tag:')) {
    Write-Host '[FAIL] Unbraced $Tag: interpolation remains in the publisher.'
    exit 1
}
if (-not $source.Contains('${Tag}:')) {
    Write-Host '[FAIL] Publisher does not use the safe ${Tag}: interpolation.'
    exit 1
}
Write-Host '[PASS] Release tag followed by colon uses braced interpolation.'

$badFixture = @'
param([string]$Tag)
Write-Output "Release $Tag:"
'@
$goodFixture = @'
param([string]$Tag)
Write-Output "Release ${Tag}:"
'@
$badTokens = $null
$badErrors = $null
[System.Management.Automation.Language.Parser]::ParseInput($badFixture, [ref]$badTokens, [ref]$badErrors) | Out-Null
if (-not $badErrors -or $badErrors.Count -eq 0) {
    Write-Host '[FAIL] Regression fixture did not reproduce unbraced variable-colon parsing failure.'
    exit 1
}
$goodTokens = $null
$goodErrors = $null
[System.Management.Automation.Language.Parser]::ParseInput($goodFixture, [ref]$goodTokens, [ref]$goodErrors) | Out-Null
if ($goodErrors -and $goodErrors.Count -gt 0) {
    Write-Host '[FAIL] Braced variable-colon fixture still fails PowerShell parsing.'
    exit 1
}
Write-Host '[PASS] Parser regression fixture rejects $Tag: and accepts ${Tag}:.'
Write-Host '[PASS] FIX120 PowerShell interpolation regression checks: 5/5'
exit 0
