$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$cmd=Get-Content -LiteralPath (Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd') -Raw
$worker=Get-Content -LiteralPath (Join-Path $root 'KCS_FIX101_WORKER.cmd') -Raw
$sourceGate=Get-Content -LiteralPath (Join-Path $root 'CHECK_SOURCE.cmd') -Raw
$build=Get-Content -LiteralPath (Join-Path $root 'BUILD_ALL.cmd') -Raw
$portable=Get-Content -LiteralPath (Join-Path $root 'BUILD_PORTABLE.cmd') -Raw
$installer=Get-Content -LiteralPath (Join-Path $root 'BUILD_INSTALLER_MODERN.cmd') -Raw
$release=Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_RELEASES.ps1') -Raw
$clean=Get-Content -LiteralPath (Join-Path $root 'CLEAN_SAFE_TEMP.ps1') -Raw
$source=Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_SOURCE.ps1') -Raw
$sourceScope=Get-Content -LiteralPath (Join-Path $root 'CHECK_FIX100_SOURCE_SCOPE.ps1') -Raw
$checks=@(
 [pscustomobject]@{Passed=($worker.IndexOf('CLEAN_SAFE_TEMP.ps1') -lt $worker.IndexOf('BOOTSTRAP_BUILD_TOOLS.ps1') -and $worker.IndexOf('BOOTSTRAP_BUILD_TOOLS.ps1') -lt $worker.IndexOf('PUBLISH_GITHUB_SOURCE.ps1'));Name='Package-local cleanup runs before tools and source sync'},
 [pscustomobject]@{Passed=($worker.IndexOf('PUBLISH_GITHUB_SOURCE.ps1') -lt $worker.IndexOf('BUILD_ALL.cmd') -and $worker.IndexOf('BUILD_ALL.cmd') -lt $worker.IndexOf('PUBLISH_GITHUB_RELEASES.ps1') -and $worker.IndexOf('PUBLISH_GITHUB_RELEASES.ps1') -lt $worker.IndexOf('VERIFY_PUBLIC_DEPLOYMENT.ps1') -and $worker.IndexOf('VERIFY_PUBLIC_DEPLOYMENT.ps1') -lt $worker.IndexOf('INSTALL_PUBLISHED_BUILD.ps1'));Name='Source, build, release, online verify and install sequence'},
 [pscustomobject]@{Passed=($worker.Contains('"%ComSpec%" /d /c') -and $worker.Contains('02-build-all.log') -and $worker.Contains('set "RC=%ERRORLEVEL%"') -and $worker.Contains('type "%BUILD_LOG%" >>"%LOG%"'));Name='Build manager runs in isolated child CMD; output and real exit code are captured'},
 [pscustomobject]@{Passed=($build.Contains('BUILD_PORTABLE.cmd') -and $build.Contains('BUILD_INSTALLER_MODERN.cmd') -and $build.Contains('VERIFY_BUILD.cmd'));Name='Build manager includes portable, installer and verification'},
 [pscustomobject]@{Passed=($portable.Contains('csc.exe') -and $portable.Contains('VERIFY_PAYLOAD.ps1'));Name='Portable build compiles and verifies payload'},
 [pscustomobject]@{Passed=($installer.Contains('ISCC.exe') -and $installer.Contains('SETUP_MODERN.iss'));Name='Modern installer uses Inno Setup'},
 [pscustomobject]@{Passed=($release.Contains('manifest-stable.xml') -and $release.Contains('manifest-beta.xml') -and $release.Contains('SHA256SUMS.txt') -and $release -notmatch '--clobber');Name='Release contains both manifests and SHA256 without clobber'},
 [pscustomobject]@{Passed=(($cmd.Contains('/d /k') -and $cmd.Contains('KCS_FIX101_WORKER.cmd') -and $cmd -notmatch '__KCS_WORKER|KCS_KEEP_OPEN|call "%~f0"') -and $worker.Contains(':end_fail') -and $worker.Contains('exit /b 1'));Name='Persistent CMD starts separate worker without recursive labels'},
 [pscustomobject]@{Passed=($sourceGate.Contains('CHECK_FIX100_CLEANUP_PATH.ps1') -and $sourceGate.Contains('CHECK_FIX100_PIPELINE.ps1') -and $sourceGate.Contains('CHECK_FIX101_KEEP_OPEN.ps1'));Name='Source gate runs active FIX100 tests'},
 [pscustomobject]@{Passed=($clean.Contains('$ProjectRoot') -and $clean.Contains('allowedRelativeDirs') -and $clean -notmatch '\$env:(TEMP|TMP|WINDIR|LOCALAPPDATA|APPDATA)');Name='Cleaner is restricted to named package-local temp folders'},
 [pscustomobject]@{Passed=($source.Contains('dist\source-sync-temp') -and $source -notmatch '\$env:TEMP');Name='Git source-sync working clone is inside package, not system TEMP'},
 [pscustomobject]@{Passed=($source.Contains('FIX099_SOURCE_ALLOWLIST.txt') -and $source.Contains('$gitPaths.ToArray()') -and $source -notmatch '(?i)robocopy|git add -A' -and $sourceScope.Contains('FIX099_PACKAGE_MARKER'));Name='Source publishing is restricted to the explicit allowlist and clean package root'}
)
$failed=0;foreach($c in $checks){if($c.Passed){Write-Host ('[PASS] '+$c.Name)}else{Write-Host ('[FAIL] '+$c.Name);$failed++}}
if($failed){throw ("$failed FIX100 pipeline checks failed.")};Write-Host ('[PASS] FIX100 pipeline checks: '+$checks.Count+'/'+$checks.Count)
