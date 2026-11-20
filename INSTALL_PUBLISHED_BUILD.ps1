$ErrorActionPreference="Stop"

function ConvertTo-KcsProductVersion {
    [CmdletBinding()]
    param(
        [AllowNull()][object]$RawVersion,
        [Parameter(Mandatory=$true)][string]$ExpectedVersion,
        [string]$Label = 'Program'
    )

    $rawText = if ($null -eq $RawVersion) { '' } else { [string]$RawVersion }
    $normalized = $rawText.Trim()
    $expectedText = ([string]$ExpectedVersion).Trim()
    if ([string]::IsNullOrWhiteSpace($normalized)) {
        throw ("{0}: FileVersion is empty; raw=[{1}] expected=[{2}]" -f $Label,$rawText,$expectedText)
    }

    try {
        $actualVersion = [version]$normalized
        $expectedVersionObject = [version]$expectedText
    }
    catch {
        throw ("{0}: invalid FileVersion; raw=[{1}] normalized=[{2}] expected=[{3}]" -f $Label,$rawText,$normalized,$expectedText)
    }

    if ($actualVersion -ne $expectedVersionObject) {
        throw ("{0}: wrong FileVersion; raw=[{1}] normalized=[{2}] expected=[{3}]" -f $Label,$rawText,$normalized,$expectedText)
    }

    return $actualVersion.ToString()
}

$LogDir=Join-Path $PSScriptRoot "dist\build-logs"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$InstallLog=Join-Path $LogDir "installation-FIX072-inno.log"
if(Test-Path -LiteralPath $InstallLog){Remove-Item -LiteralPath $InstallLog -Force}
$Installer=Join-Path $PSScriptRoot "dist\installers\KomputeroweCentrumSerwisu_FIX072_INSTALATOR.exe"
if(!(Test-Path -LiteralPath $Installer)){throw "Nie znaleziono świeżego instalatora do instalacji."}
$versionRaw=[Diagnostics.FileVersionInfo]::GetVersionInfo($Installer).FileVersion
$version=ConvertTo-KcsProductVersion -RawVersion $versionRaw -ExpectedVersion '1.0.0.72' -Label 'Instalator'
Write-Host "[AUTO] Instaluję opublikowaną wersję $version..."
$logArgument='/LOG="' + $InstallLog + '"'
Write-Host '[INFO] Instalator uruchomi się w trybie interaktywnym.'
Write-Host '[INFO] Przeczytaj ostrzeżenie i samodzielnie zaznacz pole akceptacji ryzyka, aby kontynuować.'
Write-Host '[INFO] Automat poczeka na zakończenie kreatora, a następnie sprawdzi kod wyjścia i wersję EXE.'
$p=Start-Process -FilePath $Installer -ArgumentList @('/NORESTART','/SP-',$logArgument) -Verb RunAs -Wait -PassThru
if($p.ExitCode -ne 0){
  $meaning=switch([int]$p.ExitCode){
    1 {'Setup failed to initialize (Inno Setup exit code 1).'}
    2 {'Installation was cancelled before installation began.'}
    3 {'Fatal error while preparing installation.'}
    4 {'Fatal error during installation.'}
    5 {'Installation was cancelled during installation.'}
    default {'Unexpected Inno Setup exit code.'}
  }
  $tail=''
  if(Test-Path -LiteralPath $InstallLog){$tail=(Get-Content -LiteralPath $InstallLog -Tail 80 -ErrorAction SilentlyContinue) -join [Environment]::NewLine}
  throw ("Instalator zakończył się kodem {0}. {1} Log: {2}`n{3}" -f $p.ExitCode,$meaning,$InstallLog,$tail)
}
$exeCandidates=@(
  (Join-Path $env:ProgramFiles "Komputerowe Centrum Serwisu\KomputeroweCentrumSerwisu.exe"),
  (Join-Path ${env:ProgramFiles(x86)} "Komputerowe Centrum Serwisu\KomputeroweCentrumSerwisu.exe"),
  (Join-Path $env:LOCALAPPDATA "Programs\Komputerowe Centrum Serwisu\KomputeroweCentrumSerwisu.exe")
)
$exe=$exeCandidates | Where-Object {Test-Path -LiteralPath $_} | Select-Object -First 1
if(!$exe){
  $keys=@("HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\{F6A4B4D8-7D02-4BA9-9C3D-2C99B1D5C014}_is1","HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\{F6A4B4D8-7D02-4BA9-9C3D-2C99B1D5C014}_is1")
  foreach($k in $keys){if(Test-Path $k){$loc=(Get-ItemProperty $k).InstallLocation;if($loc){$candidate=Join-Path $loc "KomputeroweCentrumSerwisu.exe";if(Test-Path $candidate){$exe=$candidate;break}}}}
}
if(!$exe){throw "Instalator zakończył pracę, ale nie można odnaleźć zainstalowanego pliku EXE do weryfikacji."}
$installedRaw=[Diagnostics.FileVersionInfo]::GetVersionInfo($exe).FileVersion
$installed=ConvertTo-KcsProductVersion -RawVersion $installedRaw -ExpectedVersion '1.0.0.72' -Label 'Zainstalowany program'
Write-Host "[PASS] Zainstalowana wersja: $installed"
Write-Host "[PASS] Repozytorium aktualizacji jest zapisane w instalatorze: naprawapclaptop1-dev/komputerowe-centrum-serwisu"
Write-Host ("[PASS] Log instalatora: {0}" -f $InstallLog)
Start-Process -FilePath $exe
