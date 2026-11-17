#requires -Version 5.1
[CmdletBinding(SupportsShouldProcess=$true,ConfirmImpact='High')]
param([string]$Name='Nauka-Analiza-Offline',[switch]$DeleteFiles)
$ErrorActionPreference='Stop'
if(-not (Get-Command Get-VM -ErrorAction SilentlyContinue)){throw 'Hyper-V nie jest dostępny.'}
$vm=Get-VM -Name $Name -ErrorAction Stop
if($vm.State -ne 'Off'){Stop-VM -Name $Name -TurnOff -Confirm:$false -ErrorAction Stop}
if($DeleteFiles){
    $paths=@(Get-VMHardDiskDrive -VMName $Name | ForEach-Object Path | Where-Object { $_ })
    if($PSCmdlet.ShouldProcess($Name,'Usuń maszynę i wskazane pliki VHDX')){
        Remove-VM -Name $Name -Force -ErrorAction Stop
        foreach($path in $paths){if(Test-Path -LiteralPath $path){Remove-Item -LiteralPath $path -Force}}
        Write-Host 'Maszyna i pliki wskazanych dysków zostały usunięte.' -ForegroundColor Yellow
    }
}else{
    if($PSCmdlet.ShouldProcess($Name,'Usuń tylko definicję VM; zachowaj pliki dysków')){Remove-VM -Name $Name -Force -ErrorAction Stop;Write-Host 'Usunięto definicję VM. Pliki VHDX pozostawiono.' -ForegroundColor Green}
}
