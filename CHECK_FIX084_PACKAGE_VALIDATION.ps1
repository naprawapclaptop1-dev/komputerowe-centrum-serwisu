$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$cmd = Get-Content (Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd') -Raw
$validator = Get-Content (Join-Path $root 'VALIDATE_FIX084_PACKAGE.ps1') -Raw
$source = Get-Content (Join-Path $root 'PUBLISH_GITHUB_SOURCE.ps1') -Raw
$release = Get-Content (Join-Path $root 'PUBLISH_GITHUB_RELEASES.ps1') -Raw
$marker = Get-Content (Join-Path $root 'FIX084_PACKAGE_MARKER.txt') -Raw
$checks = @(
    @($marker.Contains('PACKAGE=FIX084') -and $marker.Contains('REPOSITORY=naprawapclaptop1-dev/komputerowe-centrum-serwisu'), 'Marker identifies FIX084 and assigned repository'),
    @($cmd.Contains('VALIDATE_FIX084_PACKAGE.ps1') -and $cmd.Contains('PUBLISH_GITHUB_SOURCE.ps1') -and $cmd.Contains('BUILD_ALL.cmd') -and $cmd.Contains('PUBLISH_GITHUB_RELEASES.ps1'), 'Single CMD runs validation, source sync, build and release publisher'),
    @($validator.Contains('FIX084_POWERSHELL_MANIFEST.txt') -and $validator.Contains('Get-FileHash') -and $validator.Contains('Parser]::ParseFile'), 'Validator checks explicit manifest, SHA-256, BOM and parser'),
    @(-not $validator.Contains('Get-ChildItem -LiteralPath $root -Recurse'), 'Validator does not scan unrelated legacy scripts in target folder'),
    @($source.Contains('FIX084_PACKAGE_MARKER.txt') -and $source.Contains('PACKAGE=FIX084'), 'Source publisher checks FIX084 marker'),
    @($release.Contains('FIX084_PACKAGE_MARKER.txt') -and $release.Contains('PACKAGE=FIX084'), 'Release publisher checks FIX084 marker'),
    @((Get-Content (Join-Path $root 'VERSION.txt') -Raw).Contains('1.0.0.69'), 'Application version remains 1.0.0.69'),
    @($cmd.Contains('CHECK_FIX084_CMD_ENCODING.ps1') -and $cmd.Contains('CHECK_FIX084_PAGES_CONFIGURATION.ps1') -and $cmd.Contains('CHECK_FIX084_SOURCE_CACHE_EXCLUSIONS.ps1'), 'Single CMD runs all FIX084 safety checks')
)
$failed = 0
foreach ($check in $checks) {
    if ($check[0]) { Write-Host ('[PASS] ' + $check[1]) }
    else { Write-Host ('[FAIL] ' + $check[1]); $failed++ }
}
if ($failed -gt 0) { throw ($failed.ToString() + ' FIX084 regression checks failed.') }
Write-Host ('[PASS] FIX084 regression checks: ' + $checks.Count + '/' + $checks.Count)
