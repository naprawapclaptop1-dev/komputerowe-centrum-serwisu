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
    $item = [pscustomobject]@{
        Passed = $Passed
        Name = $Name
    }
    [void]$checks.Add($item)
}

$cleanupVisible = [bool]($cmd.Contains('CLEAN_SAFE_TEMP.ps1') -and $cmd.Contains('SAFE_TEMP_CLEANUP.log') -and ($cmd -notmatch 'CLEAN_SAFE_TEMP\.ps1.*>>"%LOG%'))
Add-Check $cleanupVisible 'Single CMD runs safe temporary-file cleanup, shows results, and logs it'

$cleanupAt = $cmd.IndexOf('CLEAN_SAFE_TEMP.ps1')
$toolsAt = $cmd.IndexOf('BOOTSTRAP_BUILD_TOOLS.ps1')
$sourceAt = $cmd.IndexOf('PUBLISH_GITHUB_SOURCE.ps1')
$buildAt = $cmd.IndexOf('BUILD_ALL.cmd')
$releaseAt = $cmd.IndexOf('PUBLISH_GITHUB_RELEASES.ps1')
$verifyAt = $cmd.IndexOf('VERIFY_PUBLIC_DEPLOYMENT.ps1')
$installAt = $cmd.IndexOf('INSTALL_PUBLISHED_BUILD.ps1')
$orderOk = [bool](($cleanupAt -ge 0) -and ($toolsAt -gt $cleanupAt) -and ($sourceAt -gt $toolsAt) -and ($buildAt -gt $sourceAt) -and ($releaseAt -gt $buildAt) -and ($verifyAt -gt $releaseAt) -and ($installAt -gt $verifyAt))
Add-Check $orderOk 'Full order is cleanup, tools, source+site, build, release, online test, install'

$sourceGateOk = [bool]($sourceGate.Contains('CHECK_FIX091_PIPELINE.ps1') -and ($sourceGate -notmatch 'CHECK_FIX07[1-6]_'))
Add-Check $sourceGateOk 'Source gate runs current tests only; obsolete FIX071-FIX076 checks are archived'

$currentTestsOk = [bool]($sourceGate.Contains('CHECK_FIX083_NATIVE_PROCESS.ps1') -and $sourceGate.Contains('CHECK_FIX084_CMD_ENCODING.ps1') -and $sourceGate.Contains('CHECK_FIX085_GIT_CLONE_LONGPATHS.ps1') -and $sourceGate.Contains('CHECK_FIX091_PAGES_TRIGGER.ps1'))
Add-Check $currentTestsOk 'Source gate retains native process, Pages, long-path and current pipeline checks'

$buildOk = [bool]($build.Contains('CHECK_SOURCE.cmd') -and $build.Contains('BUILD_PORTABLE.cmd') -and $build.Contains('BUILD_INSTALLER_MODERN.cmd') -and $build.Contains('VERIFY_BUILD.cmd'))
Add-Check $buildOk 'Build manager validates sources, makes portable and modern installer, then verifies outputs'

$portableOk = [bool]($portable.Contains('csc.exe') -and $portable.Contains('VERIFY_PAYLOAD.ps1') -and $portable.Contains('PORTABLE.status'))
Add-Check $portableOk 'Portable build compiles and verifies fresh EXE with BUILD_ID'

$installerOk = [bool]($installer.Contains('ISCC.exe') -and $installer.Contains('SETUP_MODERN.iss') -and $installer.Contains('MODERN_INSTALLER.status'))
Add-Check $installerOk 'Modern installer build invokes Inno Setup and writes status'

$releaseOk = [bool]($release.Contains('manifest-stable.xml') -and $release.Contains('manifest-beta.xml') -and $release.Contains('releases.json') -and $release.Contains('SHA256SUMS.txt') -and $release.Contains('--draft') -and ($release -notmatch '--clobber'))
Add-Check $releaseOk 'Release publishes installer/portable/manifests/catalog/hash without clobber'

$cleanupSafe = [bool]($clean.Contains('$env:TEMP') -and $clean.Contains('.tmp') -and $clean.Contains('.temp') -and $clean.Contains('AddDays(-[Math]::Max(1,$GenericTempAgeDays))') -and $clean.Contains('Preserved application data') -and $clean.Contains('-Recurse') -and $clean.Contains('[IO.FileShare]::None') -and $clean.Contains('[IO.FileAttributes]::System'))
Add-Check $cleanupSafe 'Cleanup is limited to old temporary files in TEMP subfolders and preserves app data'

$cleanupNoAppData = [bool](($clean -notmatch 'Remove-Item.*(AppData\\Roaming|ProgramData|HKLM|HKCU)') -and ($clean -notmatch 'Remove-Item.*node_modules|Remove-Item.*\.tools'))
Add-Check $cleanupNoAppData 'Cleanup never targets settings, registry, app data or build tool caches'

$failureDiagnostics = [bool]($cmd.Contains(':build_fail') -and $cmd.Contains('stage-portable-output.log') -and $cmd.Contains('stage-modern-output.log') -and $cmd.Contains('BUILD_SUMMARY.txt'))
Add-Check $failureDiagnostics 'CMD prints concrete build-stage diagnostics on failure'

$keepOpen = [bool]($cmd.Contains('pause') -and $cmd.Contains(':end_fail'))
Add-Check $keepOpen 'CMD keeps console open on error'

$singleSourceGate = [bool]($cmd.Contains('CHECK_SOURCE.cmd') -and $cmd.Contains('/skip-source-check') -and $build.Contains('if /i "%~2"=="/skip-source-check"') -and $build.Contains('not repeated'))
Add-Check $singleSourceGate 'Main CMD runs source gate once; BUILD_ALL does not repeat it'

$failed = 0
foreach ($check in $checks) {
    if ($check.Passed) {
        Write-Host ('[PASS] ' + $check.Name)
    } else {
        Write-Host ('[FAIL] ' + $check.Name)
        $failed++
    }
}
if ($failed -gt 0) {
    throw ("$failed FIX091 pipeline checks failed.")
}
Write-Host ('[PASS] FIX091 pipeline checks: ' + $checks.Count + '/' + $checks.Count)
