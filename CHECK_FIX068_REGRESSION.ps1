$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$modules=Get-Content (Join-Path $root 'WindowsVersionSwitcherPRO.Modules.cs') -Raw
$assembly=Get-Content (Join-Path $root 'AssemblyInfo.cs') -Raw
$pub=Get-Content (Join-Path $root 'PUBLISH_GITHUB_RELEASES.ps1') -Raw
$cmd=Get-Content (Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd') -Raw
$checks=@(
 @($assembly -match 'AssemblyFileVersion\("1\.0\.0\.69"\)','Assembly FileVersion 1.0.0.69'),
 @($assembly -match 'AssemblyVersion\("1\.0\.0\.69"\)','AssemblyVersion 1.0.0.69'),
 @($modules -match 'releases/latest/download/','GitHub latest release asset URL'),
 @($modules -match 'IsTrustedGitHubAssetUrl','GitHub asset allowlist'),
 @($pub -match 'gh release create','GitHub release create'),
 @($pub -match 'manifest-stable\.xml' -and $pub -match 'manifest-beta\.xml' -and $pub -match 'releases\.json','Stable/Beta/catalog assets'),
 @($pub -match 'Get-FileHash.*SHA256','SHA-256 generation'),
 @($cmd -match 'BUILD_ALL\.cmd' -and $cmd -match 'PUBLISH_GITHUB_RELEASES\.ps1','Single CMD pipeline'),
 @($cmd -notmatch 'CLOUDFLARE|WRANGLER|PUBLISH_CLOUDFLARE','No Cloudflare in active launcher')
)
$fail=0;foreach($c in $checks){if($c[0]){Write-Host "[PASS] $($c[1])" -ForegroundColor Green}else{Write-Host "[FAIL] $($c[1])" -ForegroundColor Red;$fail++}}
if($fail){throw "$fail active GitHub migration checks failed."};Write-Host "[PASS] Active GitHub migration checks: $($checks.Count)/$($checks.Count)"
