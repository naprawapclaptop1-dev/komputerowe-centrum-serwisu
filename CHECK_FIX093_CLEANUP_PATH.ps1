$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$cmd = Get-Content -LiteralPath (Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd') -Raw
$clean = Get-Content -LiteralPath (Join-Path $root 'CLEAN_SAFE_TEMP.ps1') -Raw
$outerCatch = [regex]::Match($clean, '(?s)\r?\ncatch\s*\{(?<body>.*?)\}\s*$')
$catchBody = if ($outerCatch.Success) { $outerCatch.Groups['body'].Value } else { '' }
$passIndex = $clean.IndexOf('[PASS] Safe cleanup completed')
$checks = @(
    [pscustomobject]@{ Name='CMD does not pass a root ending with backslash'; Passed=($cmd -match '(?m)^powershell\.exe .* -File "%ROOT%CLEAN_SAFE_TEMP\.ps1"\s*$' -and $cmd -notmatch 'CLEAN_SAFE_TEMP\.ps1.*-ProjectRoot') },
    [pscustomobject]@{ Name='Cleanup resolves trusted package root from PSScriptRoot'; Passed=($clean.Contains('$PSScriptRoot') -and $clean.Contains('GetFullPath($PSScriptRoot)')) },
    [pscustomobject]@{ Name='Cleanup checks the FIX093 marker'; Passed=($clean.Contains('FIX093_PACKAGE_MARKER.txt') -and $clean.Contains('PACKAGE=FIX093')) },
    [pscustomobject]@{ Name='Cleanup initialization catch returns FAIL and exit 2'; Passed=($outerCatch.Success -and $catchBody.Contains('[FAIL] Safe temporary cleanup initialization failed') -and $catchBody -match '\bexit\s+2\b') },
    [pscustomobject]@{ Name='Cleanup failure catch contains no PASS message'; Passed=($outerCatch.Success -and $catchBody -notmatch '\[PASS\]' -and $passIndex -ge 0 -and $passIndex -lt $outerCatch.Index) }
)
$failed=0
foreach($c in $checks){ if($c.Passed){Write-Host ('[PASS] '+$c.Name)}else{Write-Host ('[FAIL] '+$c.Name);$failed++} }
if($failed -gt 0){throw ("$failed FIX093 cleanup path checks failed.")}
Write-Host ('[PASS] FIX093 cleanup path checks: '+$checks.Count+'/'+$checks.Count)
