$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$path = Join-Path $root 'CHECK_SOURCE.cmd'
if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw 'CHECK_SOURCE.cmd is missing.' }
$bytes = [IO.File]::ReadAllBytes($path)
if ($bytes.Length -lt 9) { throw 'CHECK_SOURCE.cmd is unexpectedly short.' }
if ($bytes[0] -ne 0x40) { throw ('CHECK_SOURCE.cmd must start with @ (0x40); first bytes: ' + [BitConverter]::ToString($bytes[0..([Math]::Min(3,$bytes.Length-1))])) }
if ($bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) { throw 'UTF-8 BOM is not allowed in CHECK_SOURCE.cmd.' }
$prefix = [Text.Encoding]::ASCII.GetString($bytes,0,9)
if (-not $prefix.StartsWith('@echo off',[StringComparison]::OrdinalIgnoreCase)) { throw 'CHECK_SOURCE.cmd must begin with @echo off.' }
Write-Host '[PASS] FIX151: CHECK_SOURCE.cmd is BOM-free and starts with @echo off.'
exit 0
