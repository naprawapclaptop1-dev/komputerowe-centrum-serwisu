$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$cmd=Get-Content -LiteralPath (Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd') -Raw
$sourceGate=Get-Content -LiteralPath (Join-Path $root 'CHECK_SOURCE.cmd') -Raw
$build=Get-Content -LiteralPath (Join-Path $root 'BUILD_ALL.cmd') -Raw
$portable=Get-Content -LiteralPath (Join-Path $root 'BUILD_PORTABLE.cmd') -Raw
$installer=Get-Content -LiteralPath (Join-Path $root 'BUILD_INSTALLER_MODERN.cmd') -Raw
$release=Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_RELEASES.ps1') -Raw
$clean=Get-Content -LiteralPath (Join-Path $root 'CLEAN_SAFE_TEMP.ps1') -Raw
$checks=@(
 [pscustomobject]@{Passed=($cmd.IndexOf('CLEAN_SAFE_TEMP.ps1') -lt $cmd.IndexOf('BOOTSTRAP_BUILD_TOOLS.ps1') -and $cmd.IndexOf('BOOTSTRAP_BUILD_TOOLS.ps1') -lt $cmd.IndexOf('PUBLISH_GITHUB_SOURCE.ps1'));Name='Cleanup then tools then source sync order'},
 [pscustomobject]@{Passed=($cmd.IndexOf('PUBLISH_GITHUB_SOURCE.ps1') -lt $cmd.IndexOf('BUILD_ALL.cmd') -and $cmd.IndexOf('BUILD_ALL.cmd') -lt $cmd.IndexOf('PUBLISH_GITHUB_RELEASES.ps1') -and $cmd.IndexOf('PUBLISH_GITHUB_RELEASES.ps1') -lt $cmd.IndexOf('VERIFY_PUBLIC_DEPLOYMENT.ps1') -and $cmd.IndexOf('VERIFY_PUBLIC_DEPLOYMENT.ps1') -lt $cmd.IndexOf('INSTALL_PUBLISHED_BUILD.ps1'));Name='Source, build, release, online verify and install sequence'},
 [pscustomobject]@{Passed=($build.Contains('BUILD_PORTABLE.cmd') -and $build.Contains('BUILD_INSTALLER_MODERN.cmd') -and $build.Contains('VERIFY_BUILD.cmd'));Name='Build manager includes portable, installer and verification'},
 [pscustomobject]@{Passed=($portable.Contains('csc.exe') -and $portable.Contains('VERIFY_PAYLOAD.ps1'));Name='Portable build compiles and verifies payload'},
 [pscustomobject]@{Passed=($installer.Contains('ISCC.exe') -and $installer.Contains('SETUP_MODERN.iss'));Name='Modern installer uses Inno Setup'},
 [pscustomobject]@{Passed=($release.Contains('manifest-stable.xml') -and $release.Contains('manifest-beta.xml') -and $release.Contains('SHA256SUMS.txt') -and $release -notmatch '--clobber');Name='Release contains both manifests and SHA256 without clobber'},
 [pscustomobject]@{Passed=($cmd.Contains('pause') -and $cmd.Contains('/d /k') -and $cmd.Contains('/d /c'));Name='Persistent CMD wraps the worker process'},
 [pscustomobject]@{Passed=($sourceGate.Contains('CHECK_FIX095_APP_CACHE_CLEANUP.ps1') -and $sourceGate.Contains('CHECK_FIX095_PIPELINE.ps1'));Name='Source gate runs the active FIX095 tests'},
 [pscustomobject]@{Passed=($clean.Contains('$env:TEMP') -and $clean.Contains('.tmp') -and $clean.Contains('.temp') -and $clean.Contains('cacheTargets') -and $clean.Contains('FileShare]::None'));Name='Cleaner covers system temp and approved app caches with lock check'}
)
$failed=0;foreach($c in $checks){if($c.Passed){Write-Host ('[PASS] '+$c.Name)}else{Write-Host ('[FAIL] '+$c.Name);$failed++}}
if($failed){throw ("$failed FIX095 pipeline checks failed.")};Write-Host ('[PASS] FIX095 pipeline checks: '+$checks.Count+'/'+$checks.Count)
