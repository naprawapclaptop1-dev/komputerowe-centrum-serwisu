$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$cmd = Get-Content -LiteralPath (Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd') -Raw
$validator = Get-Content -LiteralPath (Join-Path $root 'VALIDATE_FIX088_PACKAGE.ps1') -Raw
$source = Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_SOURCE.ps1') -Raw
$release = Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_RELEASES.ps1') -Raw
$marker = Get-Content -LiteralPath (Join-Path $root 'FIX088_PACKAGE_MARKER.txt') -Raw
$legacyCheck = Get-Content -LiteralPath (Join-Path $root 'CHECK_FIX085_GIT_CLONE_LONGPATHS.ps1') -Raw
$checks = @()
$checks += [pscustomobject]@{ Passed = [bool]($marker.Contains('PACKAGE=FIX088') -and $marker.Contains('REPOSITORY=naprawapclaptop1-dev/komputerowe-centrum-serwisu')); Name = 'Marker identifies FIX088 and assigned repository' }
$checks += [pscustomobject]@{ Passed = [bool]($cmd.Contains('VALIDATE_FIX088_PACKAGE.ps1') -and $cmd.Contains('PUBLISH_GITHUB_SOURCE.ps1') -and $cmd.Contains('BUILD_ALL.cmd') -and $cmd.Contains('PUBLISH_GITHUB_RELEASES.ps1')); Name = 'Single CMD runs validation, sync, build and release publishing' }
$checks += [pscustomobject]@{ Passed = [bool]($validator.Contains('FIX088_POWERSHELL_MANIFEST.txt') -and $validator.Contains('Get-FileHash') -and $validator.Contains('Parser]::ParseFile')); Name = 'Validator checks manifest, SHA-256, BOM and parser' }
$checks += [pscustomobject]@{ Passed = [bool]($source.Contains('FIX088_PACKAGE_MARKER.txt') -and $source.Contains('PACKAGE=FIX088')); Name = 'Source publisher checks FIX088 marker' }
$checks += [pscustomobject]@{ Passed = [bool]($release.Contains('FIX088_PACKAGE_MARKER.txt') -and $release.Contains('PACKAGE=FIX088')); Name = 'Release publisher checks FIX088 marker' }
$checks += [pscustomobject]@{ Passed = [bool]$source.Contains('"-c","core.longpaths=true","clone"'); Name = 'Clone enables long paths before checkout' }
$checks += [pscustomobject]@{ Passed = [bool]($source.Contains('".tools"') -and $source.Contains('".tools/"')); Name = 'Local tool cache is excluded' }
$checks += [pscustomobject]@{ Passed = [bool]($legacyCheck.Contains('[pscustomobject]') -and $legacyCheck.Contains('$check.Passed') -and $legacyCheck -notmatch '(?m)^\s*@\('); Name = 'Legacy FIX085 startup check no longer uses nested arrays' }
$checks += [pscustomobject]@{ Passed = [bool]($cmd.Contains('goto :validation_fail') -and $cmd.Contains(':validation_fail')); Name = 'CMD reports validation failures separately from missing package files' }
$checks += [pscustomobject]@{ Passed = [bool]((Get-Content -LiteralPath (Join-Path $root 'VERSION.txt') -Raw).Contains('1.0.0.71')); Name = 'Application version remains 1.0.0.71' }
$failed = 0
foreach ($check in $checks) { if ($check.Passed) { Write-Host ('[PASS] ' + $check.Name) } else { Write-Host ('[FAIL] ' + $check.Name); $failed++ } }
if ($failed -gt 0) { throw ("$failed FIX088 package checks failed.") }
Write-Host ('[PASS] FIX088 package checks: ' + $checks.Count + '/' + $checks.Count)
