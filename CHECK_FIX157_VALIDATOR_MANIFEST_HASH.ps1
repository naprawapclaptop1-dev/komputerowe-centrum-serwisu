$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$manifest = Join-Path $root 'FIX099_POWERSHELL_MANIFEST.txt'
$target = Join-Path $root 'VALIDATE_FIX100_PACKAGE.ps1'
$selfBytes = [IO.File]::ReadAllBytes($MyInvocation.MyCommand.Path)
if ($selfBytes.Length -lt 3 -or $selfBytes[0] -ne 0xEF -or $selfBytes[1] -ne 0xBB -or $selfBytes[2] -ne 0xBF) { throw 'FIX158: regression script must be UTF-8 with BOM.' }
$rows = @(Get-Content -LiteralPath $manifest | Where-Object { $_ -and -not $_.StartsWith('#') })
$matches = @($rows | Where-Object { ($_ -split '\|', 2)[1] -eq 'VALIDATE_FIX100_PACKAGE.ps1' })
if ($matches.Count -ne 1) { throw 'FIX157: manifest must contain exactly one validator hash row.' }
$expected = (($matches[0] -split '\|', 2)[0]).ToUpperInvariant()
$actual = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToUpperInvariant()
if ($expected -ne $actual) { throw "FIX157: validator manifest hash mismatch. Expected=$expected Actual=$actual" }
Write-Host '[PASS] FIX157 validator hash matches manifest.'
