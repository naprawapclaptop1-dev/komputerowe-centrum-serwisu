#requires -Version 5.1
[CmdletBinding()]
param([Parameter(Mandatory=$true)][ValidateScript({Test-Path -LiteralPath $_ -PathType Leaf})][string]$FilePath,[string]$ReportPath=(Join-Path $env:USERPROFILE 'Desktop\NAUKA_FIX207_ANALIZA_PLIKU.json'))
$ErrorActionPreference='Stop'
$file=Get-Item -LiteralPath $FilePath -ErrorAction Stop
$hash=Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256
$signature=Get-AuthenticodeSignature -LiteralPath $file.FullName
$stream=$null;try{$stream=Get-Item -LiteralPath ($file.FullName+':Zone.Identifier') -ErrorAction Stop}catch{}
$bytes=[byte[]]::new(16);$read=0;$fs=[System.IO.File]::Open($file.FullName,[System.IO.FileMode]::Open,[System.IO.FileAccess]::Read,[System.IO.FileShare]::ReadWrite);try{$read=$fs.Read($bytes,0,$bytes.Length)}finally{$fs.Dispose()}
$magic=if($read -ge 2 -and $bytes[0] -eq 0x4D -and $bytes[1] -eq 0x5A){'PE/MZ'}elseif($read -ge 4 -and $bytes[0] -eq 0x50 -and $bytes[1] -eq 0x4B){'ZIP'}elseif($read -ge 5 -and [System.Text.Encoding]::ASCII.GetString($bytes,0,5) -eq '%PDF-'){'PDF'}else{'UNKNOWN'}
$extension=$file.Extension.ToLowerInvariant();$dangerous=@('.exe','.dll','.scr','.com','.bat','.cmd','.ps1','.vbs','.js','.hta','.msi','.iso','.img','.lnk')
$findings=[System.Collections.Generic.List[string]]::new()
if($dangerous -contains $extension){$findings.Add('Rozszerzenie może zawierać kod wykonywalny lub uruchamialny. Nie uruchamiaj pliku na hoście.')}
if($signature.Status -ne 'Valid'){$findings.Add("Podpis Authenticode nie jest prawidłowy: $($signature.Status). Brak podpisu sam w sobie nie dowodzi złośliwości.")}
if($stream){$findings.Add('Plik ma znacznik pochodzenia internetowego (Zone.Identifier).')}
if($magic -eq 'UNKNOWN'){$findings.Add('Nie rozpoznano prostego nagłówka pliku. Nie jest to werdykt malware.')}
$report=[pscustomobject]@{schema='NAUKA_FIX207_STATIC_TRIAGE';schemaVersion=1;fix='FIX207';analysedAt=(Get-Date).ToUniversalTime().ToString('o');fileName=$file.Name;extension=$extension;lengthBytes=$file.Length;sha256=$hash.Hash;signatureStatus=[string]$signature.Status;signer=if($signature.SignerCertificate){$signature.SignerCertificate.Subject}else{$null};internetZonePresent=[bool]$stream;header=$magic;findings=@($findings);executionPerformed=$false;contentUploaded=$false;verdict='NO_AUTOMATIC_MALWARE_VERDICT';note='Analiza statyczna sprawdza metadane, SHA-256, podpis i nagłówek. Nie skanuje pełnej zawartości AV/YARA, nie uruchamia pliku i nie potwierdza bezpieczeństwa.'}
$parent=Split-Path -Parent $ReportPath;if($parent -and -not (Test-Path $parent)){New-Item -ItemType Directory -Path $parent -Force|Out-Null}
$report|ConvertTo-Json -Depth 5|Set-Content -LiteralPath $ReportPath -Encoding UTF8
$report|Format-List schema,fileName,lengthBytes,sha256,signatureStatus,internetZonePresent,header,executionPerformed,contentUploaded,verdict
Write-Host "Raport: $ReportPath" -ForegroundColor Green
