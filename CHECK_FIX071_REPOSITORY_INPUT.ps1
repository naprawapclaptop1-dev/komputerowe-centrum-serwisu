$ErrorActionPreference='Stop'
$root=Split-Path -Parent $MyInvocation.MyCommand.Path
$cmd=Get-Content -LiteralPath (Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd') -Raw
$pub=Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_RELEASES.ps1') -Raw
$source=Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_SOURCE.ps1') -Raw
$expected='naprawapclaptop1-dev/komputerowe-centrum-serwisu'
$checks=@(
 @($cmd.Contains($expected),'Main CMD pins the dedicated repository'),
 @($cmd -notmatch '(?im)^\s*set\s+/p\s|Read-Host|Podaj publiczne repozytorium','No manual repository prompt'),
 @($pub.Contains($expected),'Publisher is restricted to the dedicated repository'),
 @($pub.Contains("TrimEnd('/')") -or $pub.Contains('GITHUB_REPOSITORY.txt'),'Publisher uses the canonical pinned repository value'),
 @($pub -notmatch '--clobber','Publisher never overwrites release assets'),
 @($pub.Contains('release","create') -and $pub.Contains('release","view'),'Publisher checks for existing release before creating'),
 @($source.Contains('Arguments @("clone","--branch"') -and $source.Contains('Arguments @("-C",$Temp,"push","origin","HEAD:refs/heads/$Branch")'),'Source synchronization uses the existing main branch'),
 @($source.Contains('auth","login","--web') -and $source.Contains('auth","refresh') -and $source.Contains('Invoke-NativeInteractive'),'GitHub login and Actions permissions are handled automatically'),
 @($source.Contains('repos/$Repo/pages') -and $source.Contains('build_type=workflow'),'Pages configuration is automated')
)
$failed=0;foreach($c in $checks){if($c[0]){Write-Host "[PASS] $($c[1])" -ForegroundColor Green}else{Write-Host "[FAIL] $($c[1])" -ForegroundColor Red;$failed++}}
if($failed){throw "$failed FIX071 repository checks failed."};Write-Host "[PASS] FIX071 repository checks: $($checks.Count)/$($checks.Count)"
