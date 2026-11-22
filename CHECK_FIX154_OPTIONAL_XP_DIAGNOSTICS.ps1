$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$all = [IO.File]::ReadAllText((Join-Path $root 'BUILD_ALL.cmd'))
$worker = [IO.File]::ReadAllText((Join-Path $root 'KCS_FIX101_WORKER.cmd'))
$checks = @(
  @{ Name='Optional XP builder runs in an isolated child CMD process'; Pass=($all.Contains('"%ComSpec%" /d /c') -and $all.Contains('BUILD_INSTALLER_XP.cmd')) },
  @{ Name='Missing XP status is treated as optional failure, not success'; Pass=($all.Contains('if not exist "%LOGDIR%\XP_INSTALLER.status" goto :xp_optional_failed')) },
  @{ Name='XP failure path explicitly jumps to required-output verification'; Pass=($all -match '(?s):xp_optional_failed.*?set "X_RC=OPTIONAL-FAIL"\s*goto :verify') },
  @{ Name='XP stage output is retained separately'; Pass=($all.Contains('stage-xp-output.log')) },
  @{ Name='Worker prints XP stage and detailed XP logs after build failure'; Pass=($worker.Contains('stage-xp-output.log') -and $worker.Contains('03-xp-installer.log')) },
  @{ Name='Worker prints verification diagnostics on build failure'; Pass=($worker.Contains('stage-verification-output.log')) },
  @{ Name='Product baseline remains unchanged'; Pass=((Get-Content (Join-Path $root 'VERSION.txt'))[0].Trim() -eq '1.0.0.76' -and (Get-Content (Join-Path $root 'VERSION.txt'))[1].Trim() -eq 'FIX141') }
)
$failed = @($checks | Where-Object { -not $_.Pass })
foreach ($c in $checks) { if ($c.Pass) { Write-Host ('[PASS] ' + $c.Name) } else { Write-Host ('[FAIL] ' + $c.Name) } }
if ($failed.Count) { exit 1 }
Write-Host '[PASS] FIX154 optional XP isolation and diagnostics checks: 7/7'
exit 0
