$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$cmd = Get-Content -LiteralPath (Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd') -Raw
$clean = Get-Content -LiteralPath (Join-Path $root 'CLEAN_SAFE_TEMP.ps1') -Raw
$checks = @(
    [pscustomobject]@{ Name='CMD does not pass a root ending with backslash'; Passed=($cmd -match '(?m)^powershell\.exe .* -File "%ROOT%CLEAN_SAFE_TEMP\.ps1"\s*$' -and $cmd -notmatch 'CLEAN_SAFE_TEMP\.ps1.*-ProjectRoot') },
    [pscustomobject]@{ Name='Cleanup resolves trusted package root from PSScriptRoot'; Passed=($clean.Contains('$PSScriptRoot') -and $clean.Contains('GetFullPath($PSScriptRoot)')) },
    [pscustomobject]@{ Name='Cleanup checks the FIX092 marker'; Passed=($clean.Contains('FIX092_PACKAGE_MARKER.txt') -and $clean.Contains('PACKAGE=FIX092')) },
    [pscustomobject]@{ Name='Cleanup returns an explicit failure on initialization errors'; Passed=($clean.Contains('$ErrorActionPreference = ''Stop''') -and $clean.Contains('exit 2') -and $clean.Contains('[FAIL] Safe temporary cleanup initialization failed')) }
)
$failed=0
foreach($c in $checks){ if($c.Passed){Write-Host ('[PASS] '+$c.Name)}else{Write-Host ('[FAIL] '+$c.Name);$failed++} }
if($failed -gt 0){throw ("$failed FIX092 cleanup path checks failed.")}
Write-Host ('[PASS] FIX092 cleanup path checks: '+$checks.Count+'/'+$checks.Count)
