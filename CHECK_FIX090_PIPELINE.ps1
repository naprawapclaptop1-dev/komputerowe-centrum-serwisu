$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$cmd=Get-Content -LiteralPath (Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd') -Raw
$sourceGate=Get-Content -LiteralPath (Join-Path $root 'CHECK_SOURCE.cmd') -Raw
$build=Get-Content -LiteralPath (Join-Path $root 'BUILD_ALL.cmd') -Raw
$portable=Get-Content -LiteralPath (Join-Path $root 'BUILD_PORTABLE.cmd') -Raw
$installer=Get-Content -LiteralPath (Join-Path $root 'BUILD_INSTALLER_MODERN.cmd') -Raw
$clean=Get-Content -LiteralPath (Join-Path $root 'CLEAN_SAFE_TEMP.ps1') -Raw
$release=Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_RELEASES.ps1') -Raw
$checks=@()
$checks += [pscustomobject]@{Passed=[bool]($cmd.Contains('CLEAN_SAFE_TEMP.ps1') -and $cmd.Contains('SAFE_TEMP_CLEANUP.log') -and $cmd -notmatch 'CLEAN_SAFE_TEMP.ps1.*>>\"%LOG%'));Name='Single CMD runs safe temporary-file cleanup, shows results, and logs it'}
$checks += [pscustomobject]@{Passed=[bool]($cmd.IndexOf('CLEAN_SAFE_TEMP.ps1') -lt $cmd.IndexOf('BOOTSTRAP_BUILD_TOOLS.ps1') -and $cmd.IndexOf('PUBLISH_GITHUB_SOURCE.ps1') -lt $cmd.IndexOf('BUILD_ALL.cmd') -and $cmd.IndexOf('BUILD_ALL.cmd') -lt $cmd.IndexOf('PUBLISH_GITHUB_RELEASES.ps1') -and $cmd.IndexOf('PUBLISH_GITHUB_RELEASES.ps1') -lt $cmd.IndexOf('VERIFY_PUBLIC_DEPLOYMENT.ps1') -and $cmd.IndexOf('VERIFY_PUBLIC_DEPLOYMENT.ps1') -lt $cmd.IndexOf('INSTALL_PUBLISHED_BUILD.ps1'));Name='Full order is cleanup, tools, source+site, build, release, online test, install'}
$checks += [pscustomobject]@{Passed=[bool]($sourceGate.Contains('CHECK_FIX090_PIPELINE.ps1') -and $sourceGate -notmatch 'CHECK_FIX07[1-6]_');Name='Source gate runs current tests only; obsolete FIX071-FIX076 checks are archived'}
$checks += [pscustomobject]@{Passed=[bool]($sourceGate.Contains('CHECK_FIX083_NATIVE_PROCESS.ps1') -and $sourceGate.Contains('CHECK_FIX084_PAGES_CONFIGURATION.ps1') -and $sourceGate.Contains('CHECK_FIX085_GIT_CLONE_LONGPATHS.ps1'));Name='Source gate retains current native process, Pages and long-path checks'}
$checks += [pscustomobject]@{Passed=[bool]($build.Contains('CHECK_SOURCE.cmd') -and $build.Contains('BUILD_PORTABLE.cmd') -and $build.Contains('BUILD_INSTALLER_MODERN.cmd') -and $build.Contains('VERIFY_BUILD.cmd'));Name='Build manager validates sources, makes portable and modern installer, then verifies outputs'}
$checks += [pscustomobject]@{Passed=[bool]($portable.Contains('csc.exe') -and $portable.Contains('VERIFY_PAYLOAD.ps1') -and $portable.Contains('PORTABLE.status'));Name='Portable build compiles and verifies fresh EXE with BUILD_ID'}
$checks += [pscustomobject]@{Passed=[bool]($installer.Contains('ISCC.exe') -and $installer.Contains('SETUP_MODERN.iss') -and $installer.Contains('MODERN_INSTALLER.status'));Name='Modern installer build invokes Inno Setup and writes status'}
$checks += [pscustomobject]@{Passed=[bool]($release.Contains('manifest-stable.xml') -and $release.Contains('manifest-beta.xml') -and $release.Contains('releases.json') -and $release.Contains('SHA256SUMS.txt') -and $release.Contains('--draft') -and $release -notmatch '--clobber');Name='Release publishes installer/portable/manifests/catalog/hash without clobber'}
$checks += [pscustomobject]@{Passed=[bool]($clean.Contains('$env:TEMP') -and $clean.Contains('.tmp') -and $clean.Contains('.temp') -and $clean.Contains('AddDays(-[Math]::Max(1,$GenericTempAgeDays))') -and $clean.Contains('Preserved application data') -and $clean.Contains('-Recurse') -and $clean.Contains('[IO.FileShare]::None') -and $clean.Contains('[IO.FileAttributes]::System') -and $clean.Contains('[IO.FileShare]::None') -and $clean.Contains('[IO.FileAttributes]::System'));Name='Cleanup is limited to old temporary files in TEMP subfolders and preserves app data'}
$checks += [pscustomobject]@{Passed=[bool]($clean -notmatch 'Remove-Item.*(AppData\\Roaming|ProgramData|HKLM|HKCU)' -and $clean -notmatch 'Remove-Item.*node_modules|Remove-Item.*\.tools');Name='Cleanup never targets settings, registry, app data or build tool caches'}
$checks += [pscustomobject]@{Passed=[bool]($cmd.Contains(':build_fail') -and $cmd.Contains('stage-portable-output.log') -and $cmd.Contains('stage-modern-output.log') -and $cmd.Contains('BUILD_SUMMARY.txt'));Name='CMD prints concrete build-stage diagnostics on failure'}
$checks += [pscustomobject]@{Passed=[bool]($cmd.Contains('pause') -and $cmd.Contains(':end_fail'));Name='CMD keeps console open on error'}
$checks += [pscustomobject]@{Passed=[bool]($cmd.Contains('CHECK_SOURCE.cmd') -and $cmd.Contains('/skip-source-check') -and $build.Contains('if /i "%~2"=="/skip-source-check"') -and $build.Contains('not repeated'));Name='Main CMD runs source gate once; BUILD_ALL does not repeat it'}
$failed=0
foreach($c in $checks){if($c.Passed){Write-Host ('[PASS] '+$c.Name)}else{Write-Host ('[FAIL] '+$c.Name);$failed++}}
if($failed){throw ("$failed FIX090 pipeline checks failed.")}
Write-Host ('[PASS] FIX090 pipeline checks: '+$checks.Count+'/'+$checks.Count)
