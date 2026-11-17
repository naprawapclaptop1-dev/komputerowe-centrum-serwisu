#requires -Version 5.1
[CmdletBinding()]
param(
 [Parameter(Mandatory=$true)][string]$BackupFile,
 [Parameter(Mandatory=$true)][ValidatePattern('^[A-Za-z0-9_-]{2,64}$')][string]$TargetDatabase,
 [Parameter(Mandatory=$true)][string]$ConfigPath,
 [switch]$ConfirmRestore
)
$ErrorActionPreference='Stop'
if($TargetDatabase -match '(?i)naprawapc-orders|production|prod|live|main'){throw 'Odmowa: odtworzenie do bazy produkcyjnej lub głównej jest zablokowane.'}
if($TargetDatabase -notmatch '(?i)(staging|stage|test|dev)'){throw 'Nazwa docelowej bazy musi zawierać staging, stage, test lub dev.'}
$backup=(Resolve-Path -LiteralPath $BackupFile -ErrorAction Stop).Path
$config=(Resolve-Path -LiteralPath $ConfigPath -ErrorAction Stop).Path
& (Join-Path $PSScriptRoot 'FIX235_VERIFY_D1_BACKUP.ps1') -BackupFile $backup
$configText=Get-Content -LiteralPath $config -Raw
if($configText -notmatch [regex]::Escape($TargetDatabase)){throw 'Docelowa nazwa bazy nie występuje w podanym pliku konfiguracji. Nie wykonano operacji.'}
if(-not $ConfirmRestore){throw 'Odtworzenie wymaga jawnego przełącznika -ConfirmRestore. Używaj wyłącznie pustej bazy testowej.'}
$answer=Read-Host "Wpisz dokładnie ODTWORZ-TEST $TargetDatabase aby wgrać kopię do bazy testowej"
if($answer -cne "ODTWORZ-TEST $TargetDatabase"){throw 'Anulowano odtworzenie.'}
Push-Location (Split-Path -Parent $config)
try { & npx wrangler d1 execute $TargetDatabase --remote --file $backup --config $config; if($LASTEXITCODE -ne 0){throw "Wrangler zakończył kodem $LASTEXITCODE."} }
finally { Pop-Location }
Write-Host '[PASS] Polecenie odtworzenia wykonano wyłącznie na wskazanej bazie staging/test/dev.' -ForegroundColor Green
