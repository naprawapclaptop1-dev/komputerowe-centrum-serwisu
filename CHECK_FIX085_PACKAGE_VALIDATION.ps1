$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$cmd = Get-Content -LiteralPath (Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd') -Raw
$validator = Get-Content -LiteralPath (Join-Path $root 'VALIDATE_FIX085_PACKAGE.ps1') -Raw
$source = Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_SOURCE.ps1') -Raw
$release = Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_RELEASES.ps1') -Raw
$marker = Get-Content -LiteralPath (Join-Path $root 'FIX085_PACKAGE_MARKER.txt') -Raw
$checks = @()
$checks += [pscustomobject]@{ Passed = [bool]($marker.Contains('PACKAGE=FIX085') -and $marker.Contains('REPOSITORY=naprawapclaptop1-dev/komputerowe-centrum-serwisu')); Name = 'Marker identifies FIX085 and assigned repository' }
$checks += [pscustomobject]@{ Passed = [bool]($cmd.Contains('VALIDATE_FIX085_PACKAGE.ps1') -and $cmd.Contains('PUBLISH_GITHUB_SOURCE.ps1') -and $cmd.Contains('BUILD_ALL.cmd') -and $cmd.Contains('PUBLISH_GITHUB_RELEASES.ps1')); Name = 'Single CMD runs validation, sync, build and release publishing' }
$checks += [pscustomobject]@{ Passed = [bool]($validator.Contains('FIX085_POWERSHELL_MANIFEST.txt') -and $validator.Contains('Get-FileHash') -and $validator.Contains('Parser]::ParseFile')); Name = 'Validator checks explicit manifest, SHA-256, BOM and PowerShell parser' }
$checks += [pscustomobject]@{ Passed = [bool]($source.Contains('FIX085_PACKAGE_MARKER.txt') -and $source.Contains('PACKAGE=FIX085')); Name = 'Source publisher checks FIX085 marker' }
$checks += [pscustomobject]@{ Passed = [bool]($release.Contains('FIX085_PACKAGE_MARKER.txt') -and $release.Contains('PACKAGE=FIX085')); Name = 'Release publisher checks FIX085 marker' }
$checks += [pscustomobject]@{ Passed = [bool]$source.Contains('"-c","core.longpaths=true","clone"'); Name = 'Clone enables long paths before checkout' }
$checks += [pscustomobject]@{ Passed = [bool]($source.Contains('".tools"') -and $source.Contains('".tools/"')); Name = 'Cache is excluded from copy and ignored in repository' }
$checks += [pscustomobject]@{ Passed = [bool]( (Get-Content -LiteralPath (Join-Path $root 'VERSION.txt') -Raw).Contains('1.0.0.71') ); Name = 'Application version remains 1.0.0.71' }
$failed = 0
foreach ($check in $checks) { if ($check.Passed) { Write-Host ('[PASS] ' + $check.Name) } else { Write-Host ('[FAIL] ' + $check.Name); $failed++ } }
if ($failed -gt 0) { throw ("$failed FIX085 regression checks failed.") }
Write-Host ('[PASS] FIX085 regression checks: ' + $checks.Count + '/' + $checks.Count)
