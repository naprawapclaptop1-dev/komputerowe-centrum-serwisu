$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$files=@('URUCHOM_TYLKO_TEN_PLIK.cmd','CHECK_SOURCE.cmd')
foreach($name in $files){
  $path=Join-Path $root $name
  if(-not (Test-Path -LiteralPath $path -PathType Leaf)){throw "Missing CMD file: $name"}
  $bytes=[IO.File]::ReadAllBytes($path)
  if($bytes.Length -lt 1 -or $bytes[0] -ne 64){throw "CMD file $name must start with @echo off and have no UTF-8 BOM."}
  Write-Host ("[PASS] CMD UTF-8 without BOM: "+$name)
}
$launcher=Get-Content -LiteralPath (Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd') -Raw
$worker=Get-Content -LiteralPath (Join-Path $root 'KCS_FIX101_WORKER.cmd') -Raw
if($launcher -match 'do call :set_tool_path' -or $launcher -match ':set_tool_path'){throw 'Launcher must not use nested CALL tool-path parsing.'}
if($worker -notmatch 'if defined GH_EXE for %%G' -or $worker -notmatch 'if defined GIT_EXE for %%G'){throw 'Worker must add GH/GIT folders to PATH with direct FOR parsing after tool discovery.'}
Write-Host '[PASS] FIX084 CMD encoding and worker PATH parsing checks: 4/4'
