$ErrorActionPreference='Stop'
$root=[IO.Path]::GetFullPath($PSScriptRoot)
$cmd=Get-Content -LiteralPath (Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd') -Raw
$worker=Get-Content -LiteralPath (Join-Path $root 'KCS_FIX101_WORKER.cmd') -Raw
$clean=Get-Content -LiteralPath (Join-Path $root 'CLEAN_SAFE_TEMP.ps1') -Raw
$checks=@(
 [pscustomobject]@{Passed=($clean.Contains('FIX099_PACKAGE_MARKER.txt') -and $clean.Contains('PACKAGE=FIX099'));Name='Cleaner validates the package marker instead of the extracted folder name'},
 [pscustomobject]@{Passed=($clean.Contains('$PSScriptRoot') -and $clean.Contains('FIX099_PACKAGE_MARKER.txt') -and $clean.Contains('PACKAGE=FIX099') -and $clean -notmatch 'GetFileName\(\$ProjectRoot\).*KCS_FIX099');Name='Cleaner derives and verifies the FIX100 package root'},
 [pscustomobject]@{Passed=($clean.Contains("'temp', 'tmp', 'dist\temp', 'dist\tmp', 'build\temp', 'build\tmp'"));Name='Only named temporary folders inside the package are eligible'},
 [pscustomobject]@{Passed=($clean.Contains('dist\source-sync-temp') -and $clean.Contains('KCS_FIX[0-9]{3}_SourceSync_'));Name='Only this product source-sync temp folders inside dist are eligible'},
 [pscustomobject]@{Passed=($clean.Contains('$ProjectRoot') -and $clean.Contains('$projectPrefix') -and $clean.Contains('StartsWith'));Name='Deletion paths are checked against the package-root boundary'},
 [pscustomobject]@{Passed=($clean -notmatch '\$env:(TEMP|TMP|WINDIR|LOCALAPPDATA|APPDATA)' -and $clean -notmatch 'Windows\\Temp');Name='No system TEMP, Windows TEMP or user-profile paths are accessed'},
 [pscustomobject]@{Passed=($clean.Contains('[IO.FileShare]::None') -and $clean.Contains('ReparsePoint') -and $clean.Contains('FileAttributes]::System'));Name='Locked, system and reparse-point files are skipped'},
 [pscustomobject]@{Passed=($clean.Contains('dist\build-logs') -and $clean.Contains('SAFE_TEMP_CLEANUP.log'));Name='Cleanup report stays in the package folder'},
 [pscustomobject]@{Passed=($worker.Contains('CLEAN_SAFE_TEMP.ps1') -and $worker.Contains('SAFE_TEMP_CLEANUP.log') -and $worker.Contains('CLEAN_RC'));Name='Persistent worker invokes and reports package-local cleanup'}
)
$failed=0;foreach($c in $checks){if($c.Passed){Write-Host ('[PASS] '+$c.Name)}else{Write-Host ('[FAIL] '+$c.Name);$failed++}}
if($failed){throw ("$failed FIX100 cleanup-scope checks failed.")};Write-Host ('[PASS] FIX100 cleanup-scope checks: '+$checks.Count+'/'+$checks.Count)
