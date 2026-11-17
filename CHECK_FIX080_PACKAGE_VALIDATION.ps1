$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$cmd = Get-Content (Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd') -Raw
$validator = Get-Content (Join-Path $root 'VALIDATE_FIX080_PACKAGE.ps1') -Raw
$source = Get-Content (Join-Path $root 'PUBLISH_GITHUB_SOURCE.ps1') -Raw
$release = Get-Content (Join-Path $root 'PUBLISH_GITHUB_RELEASES.ps1') -Raw
$marker = Get-Content (Join-Path $root 'FIX080_PACKAGE_MARKER.txt') -Raw
$checks = @(
    @($marker.Contains('PACKAGE=FIX080') -and $marker.Contains('REPOSITORY=naprawapclaptop1-dev/komputerowe-centrum-serwisu'), 'Marker has FIX080 identity and assigned repository'),
    @($cmd.Contains('VALIDATE_FIX080_PACKAGE.ps1') -and $cmd.Contains('PUBLISH_GITHUB_SOURCE.ps1') -and $cmd.Contains('BUILD_ALL.cmd') -and $cmd.Contains('PUBLISH_GITHUB_RELEASES.ps1'), 'Single CMD runs validator, source sync, build, and release publisher'),
    @($validator.Contains('FIX080_PACKAGE_MARKER.txt') -and $validator.Contains('PACKAGE=FIX080'), 'Validator checks FIX080 marker'),
    @($validator.Contains('ReadAllBytes') -and $validator.Contains('239') -and $validator.Contains('Parser]::ParseFile'), 'Validator checks UTF-8 BOM and PowerShell syntax'),
    @($source.Contains('FIX080_PACKAGE_MARKER.txt') -and $source.Contains('PACKAGE=FIX080'), 'Source publisher checks FIX080 marker'),
    @($release.Contains('FIX080_PACKAGE_MARKER.txt') -and $release.Contains('PACKAGE=FIX080'), 'Release publisher checks FIX080 marker'),
    @((Get-Content (Join-Path $root 'VERSION.txt') -Raw).Contains('1.0.0.69'), 'Application version remains unchanged at 1.0.0.69')
)
$failed = 0
foreach ($check in $checks) {
    if ($check[0]) { Write-Host ('[PASS] ' + $check[1]) }
    else { Write-Host ('[FAIL] ' + $check[1]); $failed++ }
}
if ($failed -gt 0) { throw ($failed.ToString() + ' FIX080 regression checks failed.') }
Write-Host ('[PASS] FIX080 regression checks: ' + $checks.Count + '/' + $checks.Count)
