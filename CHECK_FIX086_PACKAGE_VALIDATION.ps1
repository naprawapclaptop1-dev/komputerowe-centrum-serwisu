$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$cmd = Get-Content -LiteralPath (Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd') -Raw
$validator = Get-Content -LiteralPath (Join-Path $root 'VALIDATE_FIX086_PACKAGE.ps1') -Raw
$source = Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_SOURCE.ps1') -Raw
$release = Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_RELEASES.ps1') -Raw
$marker = Get-Content -LiteralPath (Join-Path $root 'FIX086_PACKAGE_MARKER.txt') -Raw
$checks = @(
  @($marker.Contains('PACKAGE=FIX086') -and $marker.Contains('REPOSITORY=naprawapclaptop1-dev/komputerowe-centrum-serwisu'), 'Marker identifies FIX086 and assigned repository'),
  @($cmd.Contains('VALIDATE_FIX086_PACKAGE.ps1') -and $cmd.Contains('PUBLISH_GITHUB_SOURCE.ps1') -and $cmd.Contains('BUILD_ALL.cmd') -and $cmd.Contains('PUBLISH_GITHUB_RELEASES.ps1'), 'Single CMD runs validation, sync, build and release publishing'),
  @($validator.Contains('FIX086_POWERSHELL_MANIFEST.txt') -and $validator.Contains('Get-FileHash') -and $validator.Contains('Parser]::ParseFile'), 'Validator checks explicit manifest, SHA-256, BOM and PowerShell parser'),
  @($source.Contains('FIX086_PACKAGE_MARKER.txt') -and $source.Contains('PACKAGE=FIX086'), 'Source publisher checks FIX086 marker'),
  @($release.Contains('FIX086_PACKAGE_MARKER.txt') -and $release.Contains('PACKAGE=FIX086'), 'Release publisher checks FIX086 marker'),
  @($source.Contains('"-c","core.longpaths=true","clone"'), 'Clone enables long paths before checkout'),
  @($source.Contains('".tools"') -and $source.Contains('".tools/"'), 'Cache is excluded from copy and ignored in repository'),
  @((Get-Content -LiteralPath (Join-Path $root 'VERSION.txt') -Raw).Contains('1.0.0.69'), 'Application version remains 1.0.0.69')
)
$failed=0
foreach($check in $checks){if($check[0]){Write-Host ('[PASS] '+$check[1])}else{Write-Host ('[FAIL] '+$check[1]);$failed++}}
if($failed){throw ("$failed FIX086 package check(s) failed.")}
Write-Host ('[PASS] FIX086 package checks: '+$checks.Count+'/'+$checks.Count)
