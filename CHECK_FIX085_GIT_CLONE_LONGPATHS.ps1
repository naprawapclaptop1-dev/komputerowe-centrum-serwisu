$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$source = Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_SOURCE.ps1') -Raw
$cloneLine = [regex]::Match($source, '(?m)^\s*\$cloneResult\s*=.*$').Value
$checks = @(
  @($cloneLine.Contains('"-c","core.longpaths=true","clone"'), 'git clone starts with core.longpaths=true'),
  @($cloneLine.Contains('"--branch",$Branch'), 'clone uses the assigned main branch'),
  @($source.Contains('".tools"') -and $source.Contains('/XD'), 'local .tools cache excluded from Robocopy'),
  @($source.Contains('".tools/"'), 'repository ignore rules contain .tools/'),
  @($source.Contains('"rm","-r","--cached","--ignore-unmatch",".tools"'), 'tracked remote .tools entries are removed from the Git index')
)
$failed = 0
foreach ($check in $checks) {
  if ($check[0]) { Write-Host ('[PASS] ' + $check[1]) }
  else { Write-Host ('[FAIL] ' + $check[1]); $failed++ }
}
if ($failed) { throw ("$failed FIX085 long-path/cache check(s) failed.") }
Write-Host ('[PASS] FIX085 Git clone long-path checks: ' + $checks.Count + '/' + $checks.Count)
