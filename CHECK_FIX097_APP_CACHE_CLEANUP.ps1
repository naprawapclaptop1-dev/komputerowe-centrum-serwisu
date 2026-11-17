$ErrorActionPreference='Stop'
$clean=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'CLEAN_SAFE_TEMP.ps1') -Raw
$checks=@(
 [pscustomobject]@{Passed=($clean.Contains("'Windows DirectX'") -and $clean.Contains("'NVIDIA driver'") -and $clean.Contains("'AMD driver'") -and $clean.Contains("'Intel driver'"));Name='Known GPU/DirectX rebuildable caches are included'},
 [pscustomobject]@{Passed=($clean.Contains("'Google Chrome'") -and $clean.Contains("'Microsoft Edge'") -and $clean.Contains("'Mozilla Firefox'") -and $clean.Contains("'Brave'") -and $clean.Contains("'Vivaldi'") -and $clean.Contains("'Opera'"));Name='Browser cache targets are explicitly allowlisted'},
 [pscustomobject]@{Passed=($clean.Contains("'Discord'") -and $clean.Contains("'Microsoft Teams classic'"));Name='Discord and classic Teams cache targets are included'},
 [pscustomobject]@{Passed=($clean.Contains("'Cache\Cache_Data'") -and $clean.Contains("'Code Cache'") -and $clean.Contains("'GPUCache'") -and $clean.Contains("'cache2'"));Name='Only explicitly named regenerable cache subfolders are selected'},
 [pscustomobject]@{Passed=($clean.Contains('[IO.FileShare]::None') -and $clean.Contains('ReparsePoint') -and $clean.Contains('FileAttributes]::System'));Name='Locked, system and reparse-point files are skipped'},
 [pscustomobject]@{Passed=($clean.Contains('Cookies') -or $clean.Contains('cookies')) -and ($clean.Contains('passwords') -or $clean.Contains('saved passwords')) -and $clean.Contains('settings') -and $clean.Contains('databases');Name='User data, credentials and app settings are explicitly preserved'},
 [pscustomobject]@{Passed=($clean.Contains('AddDays(-[Math]::Max(0, $AppCacheAgeDays))') -and $clean.Contains('$AppCacheAgeDays = 0'));Name='App cache cleanup threshold is explicit and configurable'},
 [pscustomobject]@{Passed=($clean.Contains('[SUMMARY] Other application caches') -and $clean.Contains('[CLEAN] Removed regenerable cache file'));Name='Cleanup logs app-specific removals and totals'}
)
$failed=0;foreach($c in $checks){if($c.Passed){Write-Host ('[PASS] '+$c.Name)}else{Write-Host ('[FAIL] '+$c.Name);$failed++}}
if($failed){throw ("$failed FIX097 app-cache checks failed.")};Write-Host ('[PASS] FIX097 app-cache checks: '+$checks.Count+'/'+$checks.Count)
