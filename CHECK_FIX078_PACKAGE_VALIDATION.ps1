$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$cmd=Get-Content (Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd') -Raw
$source=Get-Content (Join-Path $root 'PUBLISH_GITHUB_SOURCE.ps1') -Raw
$release=Get-Content (Join-Path $root 'PUBLISH_GITHUB_RELEASES.ps1') -Raw
$marker=Get-Content (Join-Path $root 'FIX078_PACKAGE_MARKER.txt') -Raw
$checks=@(
 @($marker.Contains('PACKAGE=FIX078') -and $marker.Contains('REPOSITORY=naprawapclaptop1-dev/komputerowe-centrum-serwisu'),'FIX078 marker identifies the exact package and repository'),
 @($cmd.Contains('findstr /x /c:"PACKAGE=FIX078"') -and $cmd.Contains('goto :wrong_package'),'CMD validates marker using separate, parser-safe commands'),
 @($cmd -notmatch '(?im)^if .*\(echo .*&.*\)$','Main CMD contains no compound one-line IF blocks vulnerable to CMD parser splitting'),
 @($cmd.Contains('allow_parent') -or $cmd.Contains('Nazwa folderu nadrzednego nie ma znaczenia'),'Parent directory name is not part of package validation'),
 @($source.Contains('FIX078_PACKAGE_MARKER.txt') -and $source.Contains('markerLines') -and $source -notmatch 'Split-Path -Leaf \$Root','Source publisher validates marker, not the folder basename'),
 @($release.Contains('FIX078_PACKAGE_MARKER.txt') -and $release.Contains('packageLines') -and $release -notmatch 'Split-Path -Leaf \$Root','Release publisher validates marker, not the folder basename'),
 @($cmd.Contains('PUBLISH_GITHUB_SOURCE.ps1') -and $cmd.Contains('BUILD_ALL.cmd') -and $cmd.Contains('PUBLISH_GITHUB_RELEASES.ps1') -and $cmd.Contains('VERIFY_PUBLIC_DEPLOYMENT.ps1'),'Single CMD retains the complete automated flow')
)
$failed=0
foreach($c in $checks){if($c[0]){Write-Host "[PASS] $($c[1])"}else{Write-Host "[FAIL] $($c[1])";$failed++}}
if($failed){throw "$failed FIX078 marker/parser checks failed."}
Write-Host "[PASS] FIX078 checks: $($checks.Count)/$($checks.Count)"
