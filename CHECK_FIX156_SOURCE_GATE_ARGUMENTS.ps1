$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$source = [IO.File]::ReadAllText((Join-Path $root 'CHECK_SOURCE.cmd'))
$checks = @(
    @{ Name='FIX154 optional XP diagnostics test is invoked independently'; Pass=($source -match '(?m)^call :run_ps_check "CHECK_FIX154_OPTIONAL_XP_DIAGNOSTICS\.ps1" ') },
    @{ Name='FIX155 release reuse test is invoked independently'; Pass=($source -match '(?m)^call :run_ps_check "CHECK_FIX155_RELEASE_REUSE_POLICY\.ps1" ') },
    @{ Name='FIX156 argument regression test is active'; Pass=($source -match '(?m)^call :run_ps_check "CHECK_FIX156_SOURCE_GATE_ARGUMENTS\.ps1" ') },
    @{ Name='No combined -File argument contains both historical test names'; Pass=(-not $source.Contains('CHECK_FIX154_OPTIONAL_XP_DIAGNOSTICS.ps1 CHECK_FIX155_RELEASE_REUSE_POLICY.ps1')) },
    @{ Name='Each test uses the shared runner that passes exactly one script path to PowerShell -File'; Pass=($source.Contains(' -File "%~dp0%~1"')) },
    @{ Name='Product baseline remains unchanged'; Pass=((Get-Content (Join-Path $root 'VERSION.txt'))[0].Trim() -eq '1.0.0.76' -and (Get-Content (Join-Path $root 'VERSION.txt'))[1].Trim() -eq 'FIX141')}
)
$failed=@($checks | Where-Object {-not $_.Pass})
foreach($c in $checks){if($c.Pass){Write-Host ('[PASS] '+$c.Name)}else{Write-Host ('[FAIL] '+$c.Name)}}
if($failed.Count){exit 1}
Write-Host '[PASS] FIX156 source-gate argument checks: 6/6'
exit 0
