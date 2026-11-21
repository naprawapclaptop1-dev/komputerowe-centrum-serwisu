﻿$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$xp = [IO.File]::ReadAllText((Join-Path $root 'BUILD_INSTALLER_XP.cmd'))
$all = [IO.File]::ReadAllText((Join-Path $root 'BUILD_ALL.cmd'))
$manager = [IO.File]::ReadAllText((Join-Path $root 'BUILD_MANAGER.cmd'))
$wrappers = [IO.File]::ReadAllText((Join-Path $root 'BUILD_INSTALLERS.cmd'))
$checks = @(
  @{ Name='Optional XP compile failures write FAIL status'; Pass=($xp.Contains('echo FAIL') -and $xp.Contains(':optional_fail')) },
  @{ Name='Optional XP compile failures return zero to the orchestrator'; Pass=($xp -match '(?s):optional_fail.*?exit /b 0') },
  @{ Name='Invalid product identity remains a hard failure'; Pass=($xp -match '(?s):identity_fail.*?exit /b 1') },
  @{ Name='XP failure log explicitly preserves required outputs'; Pass=($xp.Contains('Modern installer and Portable outputs were not deleted or modified')) },
  @{ Name='BUILD_ALL reads XP FAIL status instead of assuming exit zero means PASS'; Pass=($all.Contains('findstr /i /x "FAIL"') -and $all.Contains('OPTIONAL-FAIL')) },
  @{ Name='BUILD_ALL keeps XP failure non-blocking and continues verification'; Pass=($all -match '(?s):xp_optional_failed.*?goto :verify') },
  @{ Name='BUILD_ALL never labels XP FAIL as PASS'; Pass=($all -match '(?s)findstr /i /x "FAIL".*?goto :xp_optional_failed') },
  @{ Name='Standalone installer wrapper reports PASS/SKIP/WARN from status'; Pass=($wrappers.Contains('XP_INSTALLER.status') -and $wrappers.Contains('[WARN] XP installer did not build')) },
  @{ Name='Build Manager reports XP status separately from exit code'; Pass=($manager.Contains(':report_xp') -and $manager.Contains('XP_INSTALLER.status')) },
  @{ Name='Product baseline remains unchanged'; Pass=((Get-Content (Join-Path $root 'VERSION.txt'))[0].Trim() -eq '1.0.0.76' -and (Get-Content (Join-Path $root 'VERSION.txt'))[1].Trim() -eq 'FIX141') }
)
$failed = @($checks | Where-Object { -not $_.Pass })
foreach ($c in $checks) { if ($c.Pass) { Write-Host ('[PASS] ' + $c.Name) } else { Write-Host ('[FAIL] ' + $c.Name) } }
if ($failed.Count) { exit 1 }
Write-Host '[PASS] FIX150 optional XP orchestration checks: 10/10'
exit 0
