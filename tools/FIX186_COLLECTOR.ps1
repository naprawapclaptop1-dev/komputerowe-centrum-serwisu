#requires -Version 5.1
[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$script:BaseOut = Join-Path ([Environment]::GetFolderPath('Desktop')) 'AKADEMIA_FIX186_RAPORTY'
New-Item -ItemType Directory -Path $script:BaseOut -Force | Out-Null

function Test-IsAdministrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]::new($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}
if (-not (Test-IsAdministrator)) {
    Write-Host 'Kolektor wymaga uprawnień administratora do WPR/StorDiag i pełnych dzienników.' -ForegroundColor Yellow
    Write-Host 'Pojawi się okno UAC. Żadne polecenie naprawcze nie zostanie uruchomione.'
    $ps = (Get-Process -Id $PID).Path
    $argLine = '-NoProfile -ExecutionPolicy Bypass -File "' + $PSCommandPath + '"'
    Start-Process -FilePath $ps -Verb RunAs -ArgumentList $argLine
    exit
}

function New-RunFolder {
    $stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    $path = Join-Path $script:BaseOut ("FIX186_" + $stamp)
    New-Item -ItemType Directory -Path $path -Force | Out-Null
    return $path
}
function Convert-EventRecord {
    param([System.Diagnostics.Eventing.Reader.EventRecord]$Event)
    $message = ''
    try { $message = $Event.FormatDescription() } catch { $message = '[Nie udało się sformatować komunikatu; zachowano XML zdarzenia.]' }
    $xml = ''
    try { $xml = $Event.ToXml() } catch {}
    [pscustomobject]@{
        timeCreated = if ($Event.TimeCreated) { $Event.TimeCreated.ToUniversalTime().ToString('o') } else { '' }
        provider = [string]$Event.ProviderName
        id = [int]$Event.Id
        level = [string]$Event.LevelDisplayName
        levelValue = [int]$Event.Level
        recordId = [long]$Event.RecordId
        machine = [string]$Event.MachineName
        message = $message
        xml = $xml
    }
}
function Export-SystemDiagnosticEvents {
    param([string]$OutputFolder, [int]$Days = 7)
    $since = (Get-Date).AddDays(-[Math]::Abs($Days))
    Write-Host "Pobieram ostrzeżenia i błędy z dziennika System od $since ..."
    $providers = '(?i)(WHEA|StorPort|stornvme|storahci|Disk|Kernel-PnP|PCI|Display|nvlddmkm|amdkmdag|igfx|volmgr|Ntfs)'
    $records = @(Get-WinEvent -FilterHashtable @{ LogName = 'System'; StartTime = $since; Level = @(1,2,3) } -MaxEvents 6000 -ErrorAction SilentlyContinue |
        Where-Object { $_.ProviderName -match $providers } |
        ForEach-Object { Convert-EventRecord -Event $_ })
    $jsonPath = Join-Path $OutputFolder 'FIX186_WHEA_PCIe_Storage_SystemEvents.json'
    $csvPath = Join-Path $OutputFolder 'FIX186_WHEA_PCIe_Storage_SystemEvents.csv'
    ConvertTo-Json -InputObject @($records) -Depth 5 | Set-Content -LiteralPath $jsonPath -Encoding UTF8
    $records | Select-Object timeCreated,provider,id,level,levelValue,recordId,machine,message | Export-Csv -LiteralPath $csvPath -NoTypeInformation -Encoding UTF8
    Write-Host "Zapisano $($records.Count) zdarzeń:" -ForegroundColor Green
    Write-Host "  $jsonPath"
    Write-Host "  $csvPath"
    return $records.Count
}
function Start-WprCapture {
    $wpr = Get-Command wpr.exe -ErrorAction SilentlyContinue
    if (-not $wpr) { throw 'Nie znaleziono wpr.exe. Sprawdź instalację/wersję Windows.' }
    $folder = New-RunFolder
    $etl = Join-Path $folder 'FIX186_trace.etl'
    $xml = Join-Path $folder 'FIX186_trace.xml'
    $summary = Join-Path $folder 'FIX186_trace_summary.txt'
    $report = Join-Path $folder 'FIX186_trace_report.xml'
    Write-Host 'Sprawdzam stan WPR...'
    & $wpr.Source -status
    if ($LASTEXITCODE -ne 0) { Write-Warning 'WPR nie potwierdził statusu. Sprawdź, czy inna sesja nie jest aktywna.' }
    Write-Host 'Uruchamiam profil GeneralProfile w trybie filemode. Zbierz tylko krótki, uzgodniony ślad.' -ForegroundColor Cyan
    & $wpr.Source -start GeneralProfile -filemode
    if ($LASTEXITCODE -ne 0) { throw "WPR nie rozpoczął nagrywania (kod $LASTEXITCODE). Sprawdź `wpr -status` i spróbuj ponownie." }
    Read-Host 'Odtwórz problem na komputerze. Gdy skończysz, wróć tutaj i naciśnij ENTER'
    & $wpr.Source -stop $etl 'Akademia FIX186 — kontrolowany ślad diagnostyczny'
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $etl)) { throw 'Nie udało się zapisać śladu ETL. Sprawdź status WPR i wolne miejsce.' }
    Write-Host 'Konwertuję ETL do XML przez tracerpt…'
    & tracerpt.exe $etl -o $xml -of XML -lr -summary $summary -report $report
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $xml)) { Write-Warning 'ETL zapisany, ale tracerpt nie wygenerował XML. Otwórz ETL w WPA i wyeksportuj potrzebne tabele do CSV.' }
    Write-Host "Gotowe. ETL: $etl" -ForegroundColor Green
    if (Test-Path -LiteralPath $xml) { Write-Host "XML do importu w Akademii: $xml" }
    Write-Host 'Uwaga: ślad ETW może zawierać ścieżki plików i inne dane użytkownika. Sprawdź go przed udostępnieniem.' -ForegroundColor Yellow
}
function Start-StorDiagCollection {
    $exe = Join-Path $env:windir 'System32\stordiag.exe'
    if (-not (Test-Path -LiteralPath $exe)) { throw 'Nie znaleziono stordiag.exe na tym systemie.' }
    $folder = New-RunFolder
    Write-Host 'Uruchamiam tylko zbieranie ETW i raportów StorDiag; bez checkFSConsistency i bez naprawiania systemu plików.' -ForegroundColor Cyan
    $p = Start-Process -FilePath $exe -ArgumentList @('-collectEtw','-out',$folder) -Wait -PassThru -NoNewWindow
    if ($p.ExitCode -ne 0) { Write-Warning "StorDiag zakończył się kodem $($p.ExitCode). Sprawdź pliki, które zdążył zebrać." }
    $null = Export-SystemDiagnosticEvents -OutputFolder $folder -Days 7
    Write-Host "Zakończono. Wyniki: $folder" -ForegroundColor Green
}
function Export-EvtxFile {
    $source = Read-Host 'Pełna ścieżka do pliku EVTX (nie będzie modyfikowany)'
    $source = $source.Trim('"')
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw 'Nie znaleziono wskazanego pliku.' }
    $folder = New-RunFolder
    $limitText = Read-Host 'Maksymalna liczba zdarzeń (domyślnie 5000, maksymalnie 20000)'
    $limit = 5000; if ($limitText -match '^\d+$') { $limit=[Math]::Min(20000,[Math]::Max(1,[int]$limitText)) }
    $records = @(Get-WinEvent -Path $source -MaxEvents $limit -ErrorAction Stop | ForEach-Object { Convert-EventRecord -Event $_ })
    $out = Join-Path $folder 'FIX186_EVTX_Export.json'
    ConvertTo-Json -InputObject @($records) -Depth 5 | Set-Content -LiteralPath $out -Encoding UTF8
    $records | Select-Object timeCreated,provider,id,level,levelValue,recordId,machine,message | Export-Csv -LiteralPath (Join-Path $folder 'FIX186_EVTX_Export.csv') -NoTypeInformation -Encoding UTF8
    Write-Host "Wyeksportowano $($records.Count) zdarzeń do $out" -ForegroundColor Green
}
function Test-FirmwarePackage {
    $source = Read-Host 'Pełna ścieżka do pliku firmware/pakietu OEM (tylko odczyt)'
    $source = $source.Trim('"')
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw 'Nie znaleziono wskazanego pliku.' }
    $file = Get-Item -LiteralPath $source
    $hash = Get-FileHash -LiteralPath $source -Algorithm SHA256
    $expected = (Read-Host 'Zaufany SHA-256 OEM (ENTER, jeśli brak)').Trim().Replace(' ','').ToLowerInvariant()
    $hashValid = $null
    if ($expected) { $hashValid = ($expected -match '^[0-9a-f]{64}$') -and ($hash.Hash.ToLowerInvariant() -eq $expected) }
    $ext = $file.Extension.ToLowerInvariant()
    $sigStatus = 'Nie dotyczy bezpośrednio formatu kapsuły/bin/rom; patrz ograniczenia.'
    $sigSubject = ''
    if ($ext -in @('.cat','.exe','.dll','.sys','.ps1','.psm1')) {
        $sig = Get-AuthenticodeSignature -FilePath $source
        $sigStatus = [string]$sig.Status
        $sigSubject = [string]$sig.SignerCertificate.Subject
    }
    $catalog = ''
    if ($ext -notin @('.cat','.exe','.dll','.sys','.ps1','.psm1')) {
        $catalog = (Read-Host 'Opcjonalna ścieżka do pliku CAT pakietu sterownika/firmware (ENTER, aby pominąć)').Trim('"')
    }
    $catalogResult = 'Nie sprawdzono katalogu.'
    if ($catalog -and (Test-Path -LiteralPath $catalog -PathType Leaf)) {
        $signtool = Get-Command signtool.exe -ErrorAction SilentlyContinue
        if ($signtool) {
            $verify = & $signtool.Source verify /kp /v /c $catalog $source 2>&1
            $catalogResult = ($verify -join "`n")
            $catalogValid = ($LASTEXITCODE -eq 0)
        } else { $catalogResult = 'Nie znaleziono signtool.exe. Zainstaluj Windows SDK/WDK lub zweryfikuj katalog na stanowisku serwisowym z SignTool.'; $catalogValid = $null }
    } else { $catalogValid = $null }
    $report = [pscustomobject]@{
        fix = 'FIX186'; fileName = $file.Name; length = $file.Length; sha256 = $hash.Hash
        expectedOemSha256 = if ($expected) { $expected } else { $null }; sha256MatchesExpected = $hashValid
        authenticodeStatus = $sigStatus; signerSubject = $sigSubject; catalogVerification = $catalogResult; catalogValid = $catalogValid
        uefiCapsulePayloadSignature = 'NOT_VERIFIED_BY_GENERIC_SCRIPT — wymaga walidacji platformy/OEM i właściwego procesu podpisu.'
        note = 'Poprawny SHA-256 potwierdza zgodność z podaną wartością, nie wiarygodność źródła. Podpis pakietu Windows, podpis kapsuły i podpis obrazu firmware to różne warstwy.'
        createdAt = (Get-Date).ToUniversalTime().ToString('o')
    }
    $folder = New-RunFolder
    $out = Join-Path $folder 'FIX186_Firmware_Verification.json'
    $report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $out -Encoding UTF8
    $report | Format-List | Out-String | Set-Content -LiteralPath (Join-Path $folder 'FIX186_Firmware_Verification.txt') -Encoding UTF8
    Write-Host "Raport: $out" -ForegroundColor Green
    Write-Host 'Nie użyto flashowania, nie modyfikowano pliku źródłowego ani rejestru firmware.' -ForegroundColor Yellow
}
function Make-RunArchive {
    $files = Get-ChildItem -LiteralPath $script:BaseOut -File -Recurse -ErrorAction SilentlyContinue
    if (-not $files) { Write-Host 'Nie ma plików do spakowania.'; return }
    $zip = Join-Path $script:BaseOut ('AKADEMIA_FIX186_RAPORTY_' + (Get-Date -Format 'yyyyMMdd_HHmmss') + '.zip')
    Compress-Archive -Path (Join-Path $script:BaseOut '*') -DestinationPath $zip -CompressionLevel Optimal -Force
    Write-Host "Archiwum raportów: $zip" -ForegroundColor Green
}

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' AKADEMIA FIX186 — KOLEKTOR PRAWDZIWYCH DANYCH SERWISOWYCH' -ForegroundColor Cyan
Write-Host ' Tylko odczyt/zbieranie. Bez napraw, flashowania i kasowania.' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host "Folder wyników: $script:BaseOut"
Write-Host 'Uwaga: ETW/EVTX mogą zawierać ścieżki, nazwy procesów i dane środowiska. Uzyskaj zgodę i usuń dane wrażliwe przed wysłaniem.' -ForegroundColor Yellow
while ($true) {
    Write-Host ''
    Write-Host '1 — Zbierz krótki ślad WPR ETW, zapisz ETL i wyeksportuj XML'
    Write-Host '2 — StorDiag (-collectEtw) + zdarzenia WHEA/PCIe/Storage z System'
    Write-Host '3 — Eksportuj wskazany plik EVTX do JSON/CSV'
    Write-Host '4 — Zweryfikuj SHA-256 i podpis pakietu/katalogu firmware (bez flashowania)'
    Write-Host '5 — Spakuj zebrane raporty do ZIP'
    Write-Host '0 — Zakończ'
    $choice = Read-Host 'Wybierz działanie'
    try {
        switch ($choice) {
            '1' { Start-WprCapture }
            '2' { Start-StorDiagCollection }
            '3' { Export-EvtxFile }
            '4' { Test-FirmwarePackage }
            '5' { Make-RunArchive }
            '0' { break }
            default { Write-Host 'Nieznana opcja.' -ForegroundColor Yellow }
        }
    } catch { Write-Host "Błąd: $($_.Exception.Message)" -ForegroundColor Red }
    if ($choice -eq '0') { break }
}
Write-Host 'Kolektor zakończył pracę. Oryginalne pliki i konfiguracja Windows nie zostały zmienione.' -ForegroundColor Green
Read-Host 'Naciśnij ENTER, aby zamknąć okno'
