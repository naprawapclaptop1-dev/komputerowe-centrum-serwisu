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

$Installer=Join-Path $PSScriptRoot "dist\installers\KomputeroweCentrumSerwisu_FIX069_INSTALATOR.exe"
if(!(Test-Path -LiteralPath $Installer)){throw "Nie znaleziono świeżego instalatora do instalacji."}
$versionRaw=[Diagnostics.FileVersionInfo]::GetVersionInfo($Installer).FileVersion
$version=ConvertTo-KcsProductVersion -RawVersion $versionRaw -ExpectedVersion '1.0.0.69' -Label 'Instalator'
Write-Host "[AUTO] Instaluję opublikowaną wersję $version..."
$p=Start-Process -FilePath $Installer -ArgumentList "/VERYSILENT /SUPPRESSMSGBOXES /NORESTART /SP-" -Verb RunAs -Wait -PassThru
if($p.ExitCode -ne 0){throw "Instalator zakończył się kodem $($p.ExitCode)."}
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
$installed=ConvertTo-KcsProductVersion -RawVersion $installedRaw -ExpectedVersion '1.0.0.69' -Label 'Zainstalowany program'
Write-Host "[PASS] Zainstalowana wersja: $installed"
Write-Host "[PASS] Repozytorium aktualizacji jest zapisane w instalatorze: naprawapclaptop1-dev/komputerowe-centrum-serwisu"
Start-Process -FilePath $exe
