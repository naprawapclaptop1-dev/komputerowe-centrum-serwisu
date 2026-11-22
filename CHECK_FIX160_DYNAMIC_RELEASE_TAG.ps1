$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$versionLines=[IO.File]::ReadAllLines((Join-Path $root 'VERSION.txt'))
$version=if($versionLines.Count){$versionLines[0].Trim()}else{''}
$verify=[IO.File]::ReadAllText((Join-Path $root 'VERIFY_GLOBAL_UPDATE_SERVER.ps1'),[Text.Encoding]::UTF8)
$check108=[IO.File]::ReadAllText((Join-Path $root 'CHECK_FIX108_RELEASE_PUBLISHING.ps1'),[Text.Encoding]::UTF8)
$versionPos=$verify.IndexOf('$version=(Get-Content -LiteralPath $versionFile')
$tagPos=$verify.IndexOf('$expectedTag="v$version"')
$apiPos=$verify.IndexOf('$api="https://api.github.com/repos/$Repo/releases/tags/$expectedTag"')
$checks=@(
 [pscustomobject]@{Passed=($version -match '^\d+\.\d+\.\d+\.\d+$');Name='VERSION.txt has a four-part numeric product version'},
 [pscustomobject]@{Passed=($verify.Contains('$versionFile=Join-Path $PSScriptRoot "VERSION.txt"') -and $tagPos -ge 0);Name='Public verifier resolves release tag from VERSION.txt'},
 [pscustomobject]@{Passed=($versionPos -ge 0 -and $tagPos -gt $versionPos -and $apiPos -gt $tagPos);Name='Version and expectedTag are initialized before API URL'},
 [pscustomobject]@{Passed=$verify.Contains('GetAttribute("version") -ne $version');Name='Manifest version uses the same resolved version'},
 [pscustomobject]@{Passed=($check108.Contains('$expectedTagText = ') -and $check108.Contains('$expectedTag="v$version"'));Name='FIX108 regression checks dynamic tag assignment'}
)
$failed=@($checks|Where-Object{-not $_.Passed})
foreach($c in $checks){if($c.Passed){Write-Host ('[PASS] '+$c.Name)}else{Write-Host ('[FAIL] '+$c.Name)}}
if($failed.Count){Write-Host ('[FAIL] FIX160: '+(($failed|ForEach-Object{$_.Name}) -join '; '));exit 1}
Write-Host ('[PASS] FIX160 dynamic release tag checks: '+$checks.Count+'/'+$checks.Count)
exit 0
