$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$source = Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_SOURCE.ps1') -Raw
$allowlist = Get-Content -LiteralPath (Join-Path $root 'FIX099_SOURCE_ALLOWLIST.txt')
$cloneLine = [regex]::Match($source, '(?m)^\s*\$cloneResult\s*=.*$').Value
$checks = @()
$checks += [pscustomobject]@{ Passed = [bool]$cloneLine.Contains('"-c","core.longpaths=true","clone"'); Name = 'git clone starts with core.longpaths=true' }
$checks += [pscustomobject]@{ Passed = [bool]$cloneLine.Contains('"--branch",$Branch'); Name = 'clone uses the assigned main branch' }
$checks += [pscustomobject]@{ Passed = [bool]($source.Contains('FIX099_SOURCE_ALLOWLIST.txt') -and $source -notmatch '(?i)robocopy'); Name = 'source sync uses explicit allowlist rather than recursive copy' }
$checks += [pscustomobject]@{ Passed = [bool]($allowlist -notmatch '(?im)^\.tools(?:/|$)'); Name = 'local .tools cache excluded from source allowlist' }
$checks += [pscustomobject]@{ Passed = [bool]$source.Contains('"rm","-r","--cached","--ignore-unmatch",".tools"'); Name = 'tracked remote .tools entries are removed from the Git index' }
$checks += [pscustomobject]@{ Passed = [bool]$source.Contains('".tools/"'); Name = 'repository ignore rules contain .tools/' }
$failed = 0
foreach ($check in $checks) { if ($check.Passed) { Write-Host ('[PASS] ' + $check.Name) } else { Write-Host ('[FAIL] ' + $check.Name); $failed++ } }
if ($failed -gt 0) { throw ("$failed FIX085 long-path/cache check(s) failed.") }
Write-Host ('[PASS] FIX085 Git clone long-path/cache checks: ' + $checks.Count + '/' + $checks.Count)
