#requires -Version 5.1
[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][ValidatePattern('^[A-Za-z0-9_-]{2,64}$')][string]$DatabaseName,
  [string]$ConfigPath = '',
  [string]$OutputRoot = 'BACKUPS\D1',
  [switch]$NonInteractive
)
$ErrorActionPreference='Stop'
$projectRoot=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
if($ConfigPath){$config=(Resolve-Path -LiteralPath $ConfigPath -ErrorAction Stop).Path}else{
  $candidate=@((Join-Path $projectRoot 'wrangler.toml'),(Join-Path $projectRoot 'wrangler.jsonc'),(Join-Path $projectRoot 'wrangler.json')) | Where-Object {Test-Path -LiteralPath $_ -PathType Leaf} | Select-Object -First 1
  if(-not $candidate){throw 'Nie znaleziono wrangler.toml/json/jsonc. Podaj -ConfigPath do istniejącej konfiguracji projektu.'}
  $config=(Resolve-Path $candidate).Path
}
$configText=Get-Content -LiteralPath $config -Raw
if($configText -notmatch '(?m)^\s*binding\s*=\s*["'']DB["'']') { throw 'Konfiguracja nie potwierdza bindingu D1 o nazwie DB. Przerwano, aby nie wykonać kopii niewłaściwej bazy.' }
if($configText -notmatch [regex]::Escape($DatabaseName)) { throw 'Nazwa bazy nie występuje w wskazanym pliku konfiguracji. Sprawdź DatabaseName i ConfigPath.' }
$wrangler=Get-Command npx -ErrorAction SilentlyContinue
if(-not $wrangler){throw 'Nie znaleziono npx. Zainstaluj Node.js/npm i zaloguj właściwe konto Cloudflare.'}
$target=if([System.IO.Path]::IsPathRooted($OutputRoot)){ $OutputRoot } else { Join-Path $projectRoot $OutputRoot }
New-Item -ItemType Directory -Path $target -Force | Out-Null
$stamp=Get-Date -Format 'yyyyMMdd_HHmmss'
$out=Join-Path $target ("D1_{0}_PRZED_MIGRACJA_{1}.sql" -f $DatabaseName,$stamp)
Write-Host 'FIX210 — KOPIA ZDALNEJ BAZY D1' -ForegroundColor Cyan
Write-Host "Konfiguracja: $config"
Write-Host "Baza: $DatabaseName"
Write-Host "Plik kopii: $out"
Write-Host 'Operacja odczytuje istniejącą bazę zdalną. Nie tworzy nowej bazy i nie stosuje migracji.' -ForegroundColor Yellow
if(-not $NonInteractive){$answer=Read-Host 'Wpisz KOPIUJ, aby rozpocząć eksport zdalnej bazy';if($answer -cne 'KOPIUJ'){throw 'Użytkownik anulował eksport.'}}
Push-Location (Split-Path -Parent $config)
try {
  & npx wrangler d1 export $DatabaseName --remote --output $out --config $config
  if($LASTEXITCODE -ne 0){throw "Wrangler zakończył eksport kodem $LASTEXITCODE."}
} finally { Pop-Location }
if(-not (Test-Path -LiteralPath $out -PathType Leaf)){throw 'Wrangler nie utworzył pliku SQL.'}
$item=Get-Item -LiteralPath $out
if($item.Length -lt 128){Remove-Item -LiteralPath $out -Force;throw 'Eksport SQL jest pusty lub podejrzanie mały; plik usunięto.'}
$hash=(Get-FileHash -LiteralPath $out -Algorithm SHA256).Hash
@("database=$DatabaseName","created_at=$((Get-Date).ToUniversalTime().ToString('o'))","bytes=$($item.Length)","sha256=$hash","config=$config") | Set-Content -LiteralPath ($out+'.manifest.txt') -Encoding UTF8
Write-Host "Kopia gotowa: $out" -ForegroundColor Green
Write-Host "SHA-256: $hash"
& (Join-Path $PSScriptRoot 'FIX235_VERIFY_D1_BACKUP.ps1') -BackupFile $out
Write-Host 'Przed publikacją sprawdź manifest i przechowuj kopię w bezpiecznym miejscu.' -ForegroundColor Yellow
