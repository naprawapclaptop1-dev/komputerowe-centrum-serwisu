$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$verify = Get-Content -LiteralPath (Join-Path $root 'VERIFY_PUBLIC_DEPLOYMENT.ps1') -Raw
$versionLines = [IO.File]::ReadAllLines((Join-Path $root 'VERSION.txt'))
$version = $versionLines[0].Trim().TrimStart([char]0xFEFF)
$productFix = $versionLines[1].Trim()
$checks = @(
  [pscustomobject]@{ Passed = ($verify.Contains('[IO.File]::ReadAllLines((Join-Path $PSScriptRoot "VERSION.txt"))')); Name = 'Public verifier reads the active VERSION.txt metadata' },
  [pscustomobject]@{ Passed = ($verify.Contains('$Version = $VersionLines[0].Trim().TrimStart([char]0xFEFF)') -and $verify.Contains('$ProductFix = $VersionLines[1].Trim()')); Name = 'Public verifier derives product version and FIX identity from VERSION.txt' },
  [pscustomobject]@{ Passed = ($verify.Contains('$Tag="v$Version"') -and $verify -notmatch '(?m)^\$Version\s*=\s*"1\.0\.0\.75"'); Name = 'Public verifier does not pin an obsolete release tag' },
  [pscustomobject]@{ Passed = ($verify.Contains('$SetupName="KomputeroweCentrumSerwisu_${ProductFix}_INSTALATOR.exe"') -and $verify.Contains('$PortableName="KomputeroweCentrumSerwisu_${ProductFix}_PORTABLE.exe"')); Name = 'Public verifier derives asset names from the active product FIX' },
  [pscustomobject]@{ Passed = ($version -eq '1.0.0.76' -and $productFix -eq 'FIX141'); Name = 'Current immutable product identity remains 1.0.0.76 / FIX141' },
  [pscustomobject]@{ Passed = ($verify.Contains('$expectedPackage=$tagBase+$SetupName') -and $verify.Contains('$setupName=$SetupName') -and $verify.Contains('$portableName=$PortableName')); Name = 'Manifest and download checks use the same derived asset names' }
)
$failed = $false
foreach ($check in $checks) {
  if ($check.Passed) { Write-Host ('[PASS] ' + $check.Name) }
  else { Write-Host ('[FAIL] ' + $check.Name); $failed = $true }
}
if ($failed) { exit 1 }
Write-Host '[PASS] FIX147 public version resolver checks: 6/6'
exit 0
