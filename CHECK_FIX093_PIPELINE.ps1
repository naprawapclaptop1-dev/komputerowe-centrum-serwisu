$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$cmd = Get-Content -LiteralPath (Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd') -Raw
$sourceGate = Get-Content -LiteralPath (Join-Path $root 'CHECK_SOURCE.cmd') -Raw
$build = Get-Content -LiteralPath (Join-Path $root 'BUILD_ALL.cmd') -Raw
$portable = Get-Content -LiteralPath (Join-Path $root 'BUILD_PORTABLE.cmd') -Raw
$installer = Get-Content -LiteralPath (Join-Path $root 'BUILD_INSTALLER_MODERN.cmd') -Raw
$clean = Get-Content -LiteralPath (Join-Path $root 'CLEAN_SAFE_TEMP.ps1') -Raw
$release = Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_RELEASES.ps1') -Raw

$checks = New-Object System.Collections.Generic.List[object]
function Add-Check([bool]$Passed, [string]$Name) {
    [void]$checks.Add([pscustomobject]@{ Passed = $Passed; Name = $Name })
}

$cleanupVisible = $cmd.Contains('CLEAN_SAFE_TEMP.ps1') -and $cmd.Contains('SAFE_TEMP_CLEANUP.log') -and ($cmd -notmatch 'CLEAN_SAFE_TEMP\.ps1.*>>"%LOG%')
Add-Check ([bool]$cleanupVisible) 'Main CMD runs cleanup visibly and keeps its report'

$cleanupCall = [regex]::Match($cmd, '(?m)^powershell\.exe .* -File "%ROOT%CLEAN_SAFE_TEMP\.ps1".*$')
$noTrailingSlashArgument = $cleanupCall.Success -and ($cleanupCall.Value -notmatch '-ProjectRoot')
$cleanupUsesScriptRoot = $clean.Contains('$PSScriptRoot') -and ($clean -notmatch 'param\(\[string\]\$ProjectRoot')
Add-Check ([bool]($noTrailingSlashArgument -and $cleanupUsesScriptRoot)) 'Cleanup derives root from PSScriptRoot; no quoted trailing-backslash parameter'

# Do not reject the legitimate PASS emitted after successful cleanup. Instead inspect the
# terminal initialization catch and assert it contains FAIL + exit 2 and has no PASS token.
$outerCatch = [regex]::Match($clean, '(?s)\r?\ncatch\s*\{(?<body>.*?)\}\s*$')
$catchBody = if ($outerCatch.Success) { $outerCatch.Groups['body'].Value } else { '' }
$catchHasFail = $catchBody.Contains('[FAIL] Safe temporary cleanup initialization failed')
$catchHasExitTwo = $catchBody -match '(?m)\bexit\s+2\b'
$catchHasNoPass = $catchBody -notmatch '\[PASS\]'
$successPassBeforeCatch = ($outerCatch.Success -and $clean.IndexOf('[PASS] Safe cleanup completed') -ge 0 -and $clean.IndexOf('[PASS] Safe cleanup completed') -lt $outerCatch.Index)
$cleanupErrorSafe = $clean.Contains("`$ErrorActionPreference = 'Stop'") -and $catchHasFail -and $catchHasExitTwo -and $catchHasNoPass -and $successPassBeforeCatch
Add-Check ([bool]$cleanupErrorSafe) 'Cleanup reports PASS only on success; initialization catch returns FAIL/exit 2'

$cleanupAt = $cmd.IndexOf('CLEAN_SAFE_TEMP.ps1')
$toolsAt = $cmd.IndexOf('BOOTSTRAP_BUILD_TOOLS.ps1')
$sourceAt = $cmd.IndexOf('PUBLISH_GITHUB_SOURCE.ps1')
$buildAt = $cmd.IndexOf('BUILD_ALL.cmd')
$releaseAt = $cmd.IndexOf('PUBLISH_GITHUB_RELEASES.ps1')
$verifyAt = $cmd.IndexOf('VERIFY_PUBLIC_DEPLOYMENT.ps1')
$installAt = $cmd.IndexOf('INSTALL_PUBLISHED_BUILD.ps1')
$orderOk = ($cleanupAt -ge 0) -and ($toolsAt -gt $cleanupAt) -and ($sourceAt -gt $toolsAt) -and ($buildAt -gt $sourceAt) -and ($releaseAt -gt $buildAt) -and ($verifyAt -gt $releaseAt) -and ($installAt -gt $verifyAt)
Add-Check ([bool]$orderOk) 'Full sequence: cleanup, tools, source/site, build, release, online test, install'

$sourceGateOk = $sourceGate.Contains('CHECK_FIX093_PIPELINE.ps1') -and ($sourceGate -notmatch 'CHECK_FIX07[1-6]_')
Add-Check ([bool]$sourceGateOk) 'Source gate points to current pipeline test only'

$currentTestsOk = $sourceGate.Contains('CHECK_FIX083_NATIVE_PROCESS.ps1') -and $sourceGate.Contains('CHECK_FIX084_CMD_ENCODING.ps1') -and $sourceGate.Contains('CHECK_FIX085_GIT_CLONE_LONGPATHS.ps1') -and $sourceGate.Contains('CHECK_FIX093_PAGES_TRIGGER.ps1') -and $sourceGate.Contains('CHECK_FIX093_CLEANUP_PATH.ps1')
Add-Check ([bool]$currentTestsOk) 'Source gate retains process, encoding, clone, Pages and cleanup checks'
$requiredCleanupTest = [regex]::IsMatch($sourceGate, '(?s)for %%F in \([^)]*CHECK_FIX093_CLEANUP_PATH\.ps1[^)]*\) do')
Add-Check ([bool]$requiredCleanupTest) 'Source gate requires the cleanup regression script before running tests'

$buildOk = $build.Contains('BUILD_PORTABLE.cmd') -and $build.Contains('BUILD_INSTALLER_MODERN.cmd') -and $build.Contains('VERIFY_BUILD.cmd')
Add-Check ([bool]$buildOk) 'Build manager creates and verifies fresh portable EXE and modern installer'

$portableOk = $portable.Contains('csc.exe') -and $portable.Contains('VERIFY_PAYLOAD.ps1') -and $portable.Contains('PORTABLE.status')
Add-Check ([bool]$portableOk) 'Portable build compiles and verifies fresh EXE'

$installerOk = $installer.Contains('ISCC.exe') -and $installer.Contains('SETUP_MODERN.iss') -and $installer.Contains('MODERN_INSTALLER.status')
Add-Check ([bool]$installerOk) 'Modern installer invokes Inno Setup and writes status'

$releaseOk = $release.Contains('manifest-stable.xml') -and $release.Contains('manifest-beta.xml') -and $release.Contains('releases.json') -and $release.Contains('SHA256SUMS.txt') -and $release.Contains('--draft') -and ($release -notmatch '--clobber')
Add-Check ([bool]$releaseOk) 'Release includes Stable/Beta manifests, catalog, SHA256 and no clobber'

$cleanupSafe = $clean.Contains('$env:TEMP') -and $clean.Contains('.tmp') -and $clean.Contains('.temp') -and $clean.Contains('AddDays(-[Math]::Max(1, $GenericTempAgeDays))') -and $clean.Contains('application data, settings, databases') -and $clean.Contains('[IO.FileShare]::None') -and $clean.Contains('[IO.FileAttributes]::System')
Add-Check ([bool]$cleanupSafe) 'Cleanup limited to old unused temp files in approved TEMP roots'

$cleanupNoAppData = ($clean -notmatch 'Remove-Item.*(AppData\\Roaming|ProgramData|HKLM|HKCU)') -and ($clean -notmatch 'Remove-Item.*node_modules|Remove-Item.*\.tools')
Add-Check ([bool]$cleanupNoAppData) 'Cleanup never targets application profiles, registry, node_modules or tool caches'

$failureDiagnostics = $cmd.Contains(':build_fail') -and $cmd.Contains('stage-portable-output.log') -and $cmd.Contains('stage-modern-output.log') -and $cmd.Contains('BUILD_SUMMARY.txt')
Add-Check ([bool]$failureDiagnostics) 'CMD shows stage-specific build diagnostics'

$keepOpen = $cmd.Contains('pause') -and $cmd.Contains(':end_fail')
Add-Check ([bool]$keepOpen) 'CMD keeps console open on errors'

$singleSourceGate = $cmd.Contains('CHECK_SOURCE.cmd') -and $cmd.Contains('/skip-source-check') -and $build.Contains('if /i "%~2"=="/skip-source-check"') -and $build.Contains('not repeated')
Add-Check ([bool]$singleSourceGate) 'Main CMD executes source tests once only'

$failed = 0
foreach ($check in $checks) {
    if ($check.Passed) { Write-Host ('[PASS] ' + $check.Name) }
    else { Write-Host ('[FAIL] ' + $check.Name); $failed++ }
}
if ($failed -gt 0) { throw ("$failed FIX093 pipeline checks failed.") }
Write-Host ('[PASS] FIX093 pipeline checks: ' + $checks.Count + '/' + $checks.Count)
