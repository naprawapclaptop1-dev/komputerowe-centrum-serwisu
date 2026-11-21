$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$required = @('FIX147_RELEASE_NOTES.txt','FIX147_MODULE_MAP.txt','CHECK_FIX147_PUBLIC_VERSION_RESOLVER.ps1')
$failed = $false
foreach ($name in $required) {
  $path = Join-Path $root $name
  if ((Test-Path -LiteralPath $path -PathType Leaf) -and (Get-Item -LiteralPath $path).Length -gt 0) { Write-Host ('[PASS] FIX148 package artifact present: ' + $name) }
  else { Write-Host ('[FAIL] FIX148 package artifact missing or empty: ' + $name); $failed = $true }
}
if ($failed) { exit 1 }
Write-Host '[PASS] FIX148 package artifact regression: 3/3'
exit 0
