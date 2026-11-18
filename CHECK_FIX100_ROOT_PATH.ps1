$ErrorActionPreference='Stop'
$root=[IO.Path]::GetFullPath($PSScriptRoot)
$validator=Get-Content -LiteralPath (Join-Path $root 'VALIDATE_FIX100_PACKAGE.ps1') -Raw
$cleaner=Get-Content -LiteralPath (Join-Path $root 'CLEAN_SAFE_TEMP.ps1') -Raw
$publisher=Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_SOURCE.ps1') -Raw
$marker=Get-Content -LiteralPath (Join-Path $root 'FIX099_PACKAGE_MARKER.txt') -Raw
$checks=@(
 [pscustomobject]@{Passed=($marker -match '(?m)^PACKAGE=FIX099$' -and $marker -match '(?m)^REPOSITORY=naprawapclaptop1-dev/komputerowe-centrum-serwisu$');Name='Package identity is established by the marker and fixed repository'},
 [pscustomobject]@{Passed=($validator.Contains('FIX099_PACKAGE_MARKER.txt') -and $validator -notmatch 'rootLeaf.*KCS_FIX099');Name='Validator accepts any extracted folder name while requiring the package marker'},
 [pscustomobject]@{Passed=($cleaner.Contains('FIX099_PACKAGE_MARKER.txt') -and $cleaner -notmatch 'GetFileName.*KCS_FIX099');Name='Cleaner no longer rejects a package based on its extracted folder name'},
 [pscustomobject]@{Passed=($publisher.Contains('FIX099_PACKAGE_MARKER.txt') -and $publisher -notmatch 'Split-Path -Leaf.*KCS_FIX099');Name='Publisher validates package identity without a fixed folder name'},
 [pscustomobject]@{Passed=($validator.Contains('ReparsePoint') -and $publisher.Contains('ReparsePoint') -and $cleaner.Contains('ReparsePoint'));Name='Validator, cleaner and publisher reject reparse-point package roots'},
 [pscustomobject]@{Passed=($cleaner.Contains('katalogu głównego dysku'));Name='Cleaner rejects a drive root'}, 
 [pscustomobject]@{Passed=($validator.Contains('katalogu głównego dysku') -and $publisher.Contains('katalogiem głównym dysku'));Name='Validator and publisher reject a drive root'}
)
$failed=0
foreach($c in $checks){if($c.Passed){Write-Host ('[PASS] '+$c.Name)}else{Write-Host ('[FAIL] '+$c.Name);$failed++}}
if($failed){throw ("$failed FIX100 root-path checks failed.")}
Write-Host ('[PASS] FIX100 root-path checks: '+$checks.Count+'/'+$checks.Count)
