$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$cmd=Get-Content -LiteralPath (Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd') -Raw
$clean=Get-Content -LiteralPath (Join-Path $root 'CLEAN_SAFE_TEMP.ps1') -Raw
$catch=[regex]::Match($clean,'(?s)\ncatch\s*\{(?<body>.*?)\}\s*$')
$body=if($catch.Success){$catch.Groups['body'].Value}else{''}
$pass=$clean.IndexOf('[PASS] Safe cleanup completed')
$checks=@(
 [pscustomobject]@{Passed=($cmd -match '(?m)^powershell\.exe .* -File "%ROOT%CLEAN_SAFE_TEMP\.ps1"\s*$' -and $cmd -notmatch 'CLEAN_SAFE_TEMP\.ps1.*-ProjectRoot');Name='CMD does not pass a quoted trailing-backslash path'},
 [pscustomobject]@{Passed=($clean.Contains('$PSScriptRoot') -and $clean.Contains('GetFullPath($PSScriptRoot)'));Name='Cleaner derives trusted package root from PSScriptRoot'},
 [pscustomobject]@{Passed=($clean.Contains('FIX097_PACKAGE_MARKER.txt') -and $clean.Contains('PACKAGE=FIX097'));Name='Cleaner checks FIX097 marker'},
 [pscustomobject]@{Passed=($catch.Success -and $body.Contains('[FAIL] Safe temporary/cache cleanup initialization failed') -and $body -match '\bexit\s+2\b');Name='Initialization failure returns FAIL and exit 2'},
 [pscustomobject]@{Passed=($catch.Success -and $body -notmatch '\[PASS\]' -and $pass -ge 0 -and $pass -lt $catch.Index);Name='Cleanup never reports PASS from failure catch'},
 [pscustomobject]@{Passed=($cmd.Contains('CLEAN_SAFE_TEMP.ps1') -and $cmd.Contains('SAFE_TEMP_CLEANUP.log') -and $cmd.Contains('CLEAN_RC'));Name='CMD shows cleanup output and keeps report'}
)
$failed=0;foreach($c in $checks){if($c.Passed){Write-Host ('[PASS] '+$c.Name)}else{Write-Host ('[FAIL] '+$c.Name);$failed++}}
if($failed){throw ("$failed FIX097 cleanup-path checks failed.")};Write-Host ('[PASS] FIX097 cleanup-path checks: '+$checks.Count+'/'+$checks.Count)
