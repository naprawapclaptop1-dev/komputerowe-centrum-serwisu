#requires -Version 5.1
[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$BackupFile)
$ErrorActionPreference='Stop'
$full=(Resolve-Path -LiteralPath $BackupFile -ErrorAction Stop).Path
$manifestPath=$full+'.manifest.txt'
if(-not(Test-Path -LiteralPath $manifestPath -PathType Leaf)){throw 'Brak manifestu SHA-256. Nie można potwierdzić integralności kopii.'}
$manifest=Get-Content -LiteralPath $manifestPath
$expected=($manifest|Where-Object{$_ -like 'sha256=*'}|Select-Object -First 1) -replace '^sha256=',''
if($expected -notmatch '^[A-Fa-f0-9]{64}$'){throw 'Manifest nie zawiera poprawnej sumy SHA-256.'}
$actual=(Get-FileHash -LiteralPath $full -Algorithm SHA256).Hash
if($actual -ne $expected){throw 'Suma SHA-256 kopii nie zgadza się z manifestem.'}
$item=Get-Item -LiteralPath $full
if($item.Length -lt 128){throw 'Plik kopii jest pusty lub podejrzanie mały.'}
$python=Get-Command py -ErrorAction SilentlyContinue
if($python){& py -3 (Join-Path $PSScriptRoot '..\scripts\verify-d1-backup-fix235.py') $full}
else{$python=Get-Command python -ErrorAction SilentlyContinue;if(-not $python){throw 'Do testowego odtworzenia lokalnego wymagany jest Python 3.'} & python (Join-Path $PSScriptRoot '..\scripts\verify-d1-backup-fix235.py') $full}
if($LASTEXITCODE -ne 0){throw 'Test importu kopii do tymczasowej bazy SQLite nie powiódł się.'}
Write-Host "[PASS] SHA-256: $actual" -ForegroundColor Green
Write-Host '[PASS] Kopia została zaimportowana do tymczasowej bazy SQLite. Produkcyjna D1 nie była modyfikowana.' -ForegroundColor Green
