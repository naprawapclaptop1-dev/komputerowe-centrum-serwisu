$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$target = Join-Path $root 'VALIDATE_FIX100_PACKAGE.ps1'
$bytes = [IO.File]::ReadAllBytes($target)
if ($bytes.Length -lt 3 -or $bytes[0] -ne 0xEF -or $bytes[1] -ne 0xBB -or $bytes[2] -ne 0xBF) { Write-Host '[FAIL] FIX100 validator is missing UTF-8 BOM.'; exit 1 }
$source = [Text.Encoding]::UTF8.GetString($bytes, 3, $bytes.Length - 3)
if ($source -notmatch 'Niebezpieczny katalog uruchomienia') { Write-Host '[FAIL] Polish validator diagnostic text missing.'; exit 1 }
$tokens = $null; $errors = $null
[void][System.Management.Automation.Language.Parser]::ParseInput($source, [ref]$tokens, [ref]$errors)
if ($errors.Count -gt 0) { Write-Host '[FAIL] FIX100 validator parser errors.'; $errors | ForEach-Object { Write-Host $_.Message }; exit 1 }
Write-Host '[PASS] FIX100 validator has UTF-8 BOM and parses cleanly.'
exit 0
