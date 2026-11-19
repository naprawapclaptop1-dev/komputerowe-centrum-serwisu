$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$verifierPath = Join-Path $root 'VERIFY_BUILD.ps1'
if (-not (Test-Path -LiteralPath $verifierPath -PathType Leaf)) { throw 'VERIFY_BUILD.ps1 is missing.' }
$source = Get-Content -LiteralPath $verifierPath -Raw
$tokens = $null; $errors = $null
[System.Management.Automation.Language.Parser]::ParseFile($verifierPath,[ref]$tokens,[ref]$errors) | Out-Null
if ($errors.Count -gt 0) { throw ('VERIFY_BUILD.ps1 parser errors: ' + (($errors | ForEach-Object { $_.Message }) -join '; ')) }
Write-Host '[PASS] VERIFY_BUILD.ps1 parses without syntax errors.'

if ($source -match '(?is)param\s*\([^)]*\$Root\s*=\s*\$PSScriptRoot') {
    throw 'Root must not use PSScriptRoot in a parameter default expression.'
}
if (-not ($source.Contains('[string]$Root,') -and $source.Contains('[switch]$SelfTest'))) {
    throw 'Root and SelfTest parameters are not declared as independent optional parameters.'
}
Write-Host '[PASS] Root is not initialized during parameter binding.'

$rootInit = $source.IndexOf('if ([string]::IsNullOrWhiteSpace($Root))', [System.StringComparison]::Ordinal)
$paramStart = $source.IndexOf('param(', [System.StringComparison]::Ordinal)
$paramEnd = $source.IndexOf(')', $paramStart, [System.StringComparison]::Ordinal)
if ($rootInit -lt 0 -or $paramEnd -lt 0 -or $rootInit -le $paramEnd) {
    throw 'Root fallback must execute after the param block.'
}
if (-not ($source.Contains('$Root = $PSScriptRoot') -and $source.Contains('$Root = (Get-Location).ProviderPath'))) {
    throw 'Script root and current-directory fallbacks are required.'
}
Write-Host '[PASS] Script-root and current-directory fallbacks run after parameter binding.'

if ($source.Contains('[IO.Path]::GetFullPath($Root)')) {
    throw 'The failing GetFullPath($Root) call must not be reintroduced.'
}
if (-not ($source.Contains('Get-Item -LiteralPath $Root -Force -ErrorAction Stop') -and $source.Contains('$resolvedRoot = $rootItem.FullName') -and $source.Contains('$rootItem.PSIsContainer'))) {
    throw 'Package root must be resolved and validated through Get-Item FullName.'
}
Write-Host '[PASS] Root is normalized by PowerShell filesystem provider and checked as a directory.'

if (-not ($source.Contains('[PASS] FIX115 script root resolved: ') -and $source.Contains('Get-Item -LiteralPath $Root -Force -ErrorAction Stop'))) {
    throw 'Self-test must resolve the real script root through the filesystem provider.'
}
Write-Host '[PASS] Self-test checks the real script root before creating fixtures.'

if (-not ($source.Contains('[DIAG] Root=[') -and $source.Contains('ScriptRoot=[') -and $source.Contains('CurrentDirectory=['))) {
    throw 'Runner failure diagnostics must print Root, ScriptRoot and current directory.'
}
Write-Host '[PASS] Runner emits path diagnostics if root resolution fails.'
Write-Host '[PASS] FIX115 root initialization regression checks: 5/5'
exit 0
