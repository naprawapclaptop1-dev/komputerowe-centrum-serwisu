$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$cmd=Get-Content (Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd') -Raw
$validator=Get-Content (Join-Path $root 'VALIDATE_FIX079_PACKAGE.ps1') -Raw
$source=Get-Content (Join-Path $root 'PUBLISH_GITHUB_SOURCE.ps1') -Raw
$release=Get-Content (Join-Path $root 'PUBLISH_GITHUB_RELEASES.ps1') -Raw
$marker=Get-Content (Join-Path $root 'FIX079_PACKAGE_MARKER.txt') -Raw
$checks=@(
 @($marker.Contains('PACKAGE=FIX079') -and $marker.Contains('REPOSITORY=naprawapclaptop1-dev/komputerowe-centrum-serwisu'),'FIX079 marker has exact package and repository identity'),
 @($cmd.Contains('VALIDATE_FIX079_PACKAGE.ps1') -and $cmd -notmatch '(?i)findstr\s+/x','CMD uses PowerShell validator and does not depend on FINDSTR line-ending behavior'),
 @($validator.Contains('Get-Content -LiteralPath $markerPath') -and $validator.Contains('PSScriptRoot') -and $validator.Contains('required'),'PowerShell validator uses its own script folder and checks the full required file set'),
 @($validator.Contains('website\index.html') -and $validator.Contains('.github\workflows\deploy-pages.yml'),'Validator checks website and GitHub Pages workflow'),
 @($source.Contains('FIX079_PACKAGE_MARKER.txt') -and $source.Contains('PACKAGE=FIX079') -and $source -notmatch 'Split-Path -Leaf \$Root','Source publisher validates FIX079 marker instead of folder name'),
 @($release.Contains('FIX079_PACKAGE_MARKER.txt') -and $release.Contains('PACKAGE=FIX079') -and $release -notmatch 'Split-Path -Leaf \$Root','Release publisher validates FIX079 marker instead of folder name'),
 @($cmd.Contains('PUBLISH_GITHUB_SOURCE.ps1') -and $cmd.Contains('BUILD_ALL.cmd') -and $cmd.Contains('PUBLISH_GITHUB_RELEASES.ps1') -and $cmd.Contains('VERIFY_PUBLIC_DEPLOYMENT.ps1'),'Single CMD retains the complete automated process')
)
$failed=0
foreach($c in $checks){if($c[0]){Write-Host "[PASS] $($c[1])"}else{Write-Host "[FAIL] $($c[1])";$failed++}}
if($failed){throw "$failed FIX079 package validation checks failed."}
Write-Host "[PASS] FIX079 checks: $($checks.Count)/$($checks.Count)"
