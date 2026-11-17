param([string]$ProjectRoot=$PSScriptRoot,[int]$GenericTempAgeDays=14,[int]$KcsCloneAgeHours=24)
$ErrorActionPreference='Continue'
$ProjectRoot=[IO.Path]::GetFullPath($ProjectRoot)
$logDir=Join-Path $ProjectRoot 'dist\build-logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$log=Join-Path $logDir 'SAFE_TEMP_CLEANUP.log'
"=== SAFE TEMP CLEANUP $(Get-Date -Format o) ===" | Set-Content -LiteralPath $log -Encoding UTF8
$removedFiles=0;$removedDirs=0;$removedBytes=[long]0;$warnings=0
function Write-CleanLog([string]$Message){Add-Content -LiteralPath $log -Value $Message -Encoding UTF8;Write-Host $Message}
function Get-NormalPath([string]$Path){[IO.Path]::GetFullPath($Path).TrimEnd([IO.Path]::DirectorySeparatorChar)}
$tempRoots=@();$userTempRoot=''
if($env:TEMP -and (Test-Path -LiteralPath $env:TEMP -PathType Container)){$userTempRoot=Get-NormalPath $env:TEMP;$tempRoots+=$userTempRoot}
$windowsTemp=''
if($env:WINDIR){$windowsTemp=Join-Path $env:WINDIR 'Temp';if(Test-Path -LiteralPath $windowsTemp -PathType Container){$tempRoots+=Get-NormalPath $windowsTemp}}
$tempRoots=@($tempRoots | Select-Object -Unique)
$cloneCutoff=(Get-Date).ToUniversalTime().AddHours(-[Math]::Max(1,$KcsCloneAgeHours))
$genericCutoff=(Get-Date).ToUniversalTime().AddDays(-[Math]::Max(1,$GenericTempAgeDays))
foreach($tempRoot in $tempRoots){
  if($userTempRoot -and $tempRoot -eq $userTempRoot){
    Get-ChildItem -LiteralPath $tempRoot -Directory -Force -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^KCS_FIX[0-9]{3}_SourceSync_[0-9a-f]{32}$' -and $_.LastWriteTimeUtc -lt $cloneCutoff -and -not ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) } | ForEach-Object {
      try{$full=Get-NormalPath $_.FullName;if($full.StartsWith($tempRoot+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){$size=(Get-ChildItem -LiteralPath $full -File -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum;Remove-Item -LiteralPath $full -Recurse -Force -ErrorAction Stop;$removedDirs++;if($size){$removedBytes+=[long]$size};Write-CleanLog ('[CLEAN] Stale KCS temporary clone removed: '+$full)}}catch{$warnings++;Write-CleanLog ('[WARN] Could not clean KCS temp clone: '+$_.Exception.Message)}
    }
  }
  # Clean only *.tmp/*.temp files inside the two approved TEMP roots, including app-created subfolders.
  # Do not follow reparse points; do not inspect Downloads, app profiles, ProgramData or project folders.
  Get-ChildItem -LiteralPath $tempRoot -File -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { $_.Extension -in @('.tmp','.temp') -and $_.LastWriteTimeUtc -lt $genericCutoff -and -not ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) -and -not ($_.Attributes -band [IO.FileAttributes]::System) } | ForEach-Object {
    $stream=$null
    try{
      $full=Get-NormalPath $_.FullName
      if($full.StartsWith($tempRoot+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){
        # Exclusive read/write open avoids deleting files actively held by a running application.
        $stream=[IO.File]::Open($full,[IO.FileMode]::Open,[IO.FileAccess]::ReadWrite,[IO.FileShare]::None)
        $stream.Dispose();$stream=$null
        $size=[long]$_.Length
        Remove-Item -LiteralPath $full -Force -ErrorAction Stop
        $removedFiles++;$removedBytes+=$size
        Write-CleanLog ('[CLEAN] Old unused application temporary file removed: '+$full)
      }
    }catch{$warnings++;Write-CleanLog ('[WARN] Temp file skipped (locked/protected or unavailable): '+$_.Exception.Message)}
    finally{if($stream){$stream.Dispose()}}
  }
}
Write-CleanLog ("[PASS] Safe cleanup complete: files=$removedFiles; own KCS temp folders=$removedDirs; bytes=$removedBytes; warnings=$warnings")
Write-CleanLog '[SAFE] Preserved application data, settings, databases, registry, documents, installers, portable builds, project dist outputs, .tools, node_modules and all non-temp folders.'
if($warnings -gt 0){Write-CleanLog '[INFO] Some in-use or protected temporary files were skipped; cleanup does not block the build.'}
exit 0
