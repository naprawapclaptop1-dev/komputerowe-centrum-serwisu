$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$build = Get-Content -LiteralPath (Join-Path $root 'BUILD_ALL.cmd') -Raw
$verify = Get-Content -LiteralPath (Join-Path $root 'VERIFY_BUILD.cmd') -Raw
$xp = Get-Content -LiteralPath (Join-Path $root 'BUILD_INSTALLER_XP.cmd') -Raw
$checks = @(
  @{ Name='XP SKIPPED marker is distinguished from PASS'; Ok=($build -match 'findstr /i /x "SKIPPED"' -and $build -match '\[SKIP\] Optional XP installer') },
  @{ Name='XP successful build remains PASS'; Ok=($build -match '\[PASS\] Optional XP installer') },
  @{ Name='Verification report is printed after verification'; Ok=($build -match 'type "%LOGDIR%\\04-verification.log"') },
  @{ Name='Verifier prints its detailed log'; Ok=($verify -match 'type "%LOGDIR%\\04-verification.log"') },
  @{ Name='XP script writes SKIPPED status'; Ok=($xp -match 'echo SKIPPED') }
)
$failed = $false
foreach ($c in $checks) { if ($c.Ok) { Write-Host "[PASS] $($c.Name)" } else { Write-Host "[FAIL] $($c.Name)"; $failed=$true } }
if ($failed) { exit 1 }
Write-Host '[PASS] FIX110 build diagnostics regression checks.'
exit 0
