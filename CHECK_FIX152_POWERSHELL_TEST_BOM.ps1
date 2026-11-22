$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$target = Join-Path $root 'CHECK_FIX150_OPTIONAL_XP_ORCHESTRATION.ps1'
$bytes = [IO.File]::ReadAllBytes($target)
$hasBom = ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF)
if (-not $hasBom) { Write-Host '[FAIL] FIX150 regression script is missing UTF-8 BOM.'; exit 1 }
$source = [Text.Encoding]::UTF8.GetString($bytes)
$tokens = $null; $errors = $null
[void][System.Management.Automation.Language.Parser]::ParseInput($source, [ref]$tokens, [ref]$errors)
if ($errors.Count -gt 0) { Write-Host '[FAIL] FIX150 regression script has PowerShell parser errors.'; $errors | ForEach-Object { Write-Host $_.Message }; exit 1 }
Write-Host '[PASS] FIX150 optional XP regression script has UTF-8 BOM and parses cleanly.'
exit 0
