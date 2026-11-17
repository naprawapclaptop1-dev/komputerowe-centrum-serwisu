#requires -Version 2.0
# NAPRAWA PC - CENTRUM MIGRACJI I NAPRAW
# FIX046 — TRYB ZGODNOŚCI | PowerShell 2.0+ | Designed for legacy Windows and modern Windows.
# The launcher includes an HTA fallback for systems without PowerShell.
# All OS installation actions are interactive; no silent format/delete operation is performed.

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

$script:DataBase = $env:ProgramData
if([string]::IsNullOrEmpty($script:DataBase)){$script:DataBase=Join-Path $env:ALLUSERSPROFILE 'Application Data'}
if([string]::IsNullOrEmpty($script:DataBase)){$script:DataBase=$env:TEMP}
$script:Root = Join-Path $script:DataBase 'NaprawaPC\WindowsVersionSwitcher'
$script:ConfigDir = Join-Path $env:APPDATA 'NaprawaPC\WindowsVersionSwitcher'
$script:Config = Join-Path $script:ConfigDir 'settings.ini'
$script:SetupExe = ''
$script:IsoPath = ''
$script:CurrentTheme = 'Granatowy'
$script:Themes = @(
 @{Name='Granatowy';Back='#111827';Panel='#1F2937';Accent='#1687C9';Fore='#F3F4F6'},
 @{Name='Turkusowy';Back='#0B1720';Panel='#12313A';Accent='#009E9E';Fore='#E6FFFB'},
 @{Name='Fioletowy';Back='#171329';Panel='#292044';Accent='#805AD5';Fore='#F5F3FF'},
 @{Name='Szmaragdowy';Back='#101B16';Panel='#1D3328';Accent='#27965C';Fore='#ECFDF5'},
 @{Name='Bursztynowy';Back='#21170F';Panel='#382719';Accent='#D97706';Fore='#FFF7ED'},
 @{Name='Rubinowy';Back='#211313';Panel='#382020';Accent='#C24141';Fore='#FEF2F2'},
 @{Name='Jasny';Back='#F3F4F6';Panel='#FFFFFF';Accent='#2563EB';Fore='#111827'},
 @{Name='Grafitowy';Back='#171717';Panel='#262626';Accent='#737373';Fore='#FAFAFA'},
 @{Name='Oceaniczny';Back='#071B2A';Panel='#0D3047';Accent='#0284C7';Fore='#E0F2FE'},
 @{Name='Neonowy';Back='#090D19';Panel='#171C30';Accent='#00D4FF';Fore='#F0FDFF'}
)
New-Item -ItemType Directory -Path $script:Root -Force | Out-Null
New-Item -ItemType Directory -Path $script:ConfigDir -Force | Out-Null

function Log([string]$s) {
 if ($null -ne $script:LogBox) {
  $script:LogBox.AppendText("[$(Get-Date -Format 'HH:mm:ss')] $s`r`n")
  $script:LogBox.SelectionStart=$script:LogBox.TextLength
  $script:LogBox.ScrollToCaret()
 }
}
function Get-OSInfo {
 $o=Get-WmiObject Win32_OperatingSystem
 $cv=Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion' -ErrorAction SilentlyContinue
 $cpu=Get-WmiObject Win32_Processor | Select-Object -First 1
 $cs=Get-WmiObject Win32_ComputerSystem
 $build=''
 $display=''
 if($cv){$build=$cv.CurrentBuild;$display=$cv.DisplayVersion}
 return @{Caption=$o.Caption;Version=$o.Version;Build=$build;DisplayVersion=$display;SP=$o.ServicePackMajorVersion;Arch=$o.OSArchitecture;CPU=$cpu.Name;RAM=[math]::Round($cs.TotalPhysicalMemory/1GB,1);Manufacturer=$cs.Manufacturer;Model=$cs.Model}
}
function Load-Config {
 if(Test-Path $script:Config) {
  $lines=Get-Content $script:Config
  foreach($line in $lines) {
   if($line -like 'Theme=*'){$script:CurrentTheme=$line.Substring(6)}
  }
 }
}
function Save-Config {
 @(
  'Theme='+$script:CurrentTheme,
  'ProgramChannel='+$programChannelBox.Text,
  'WindowsChannel='+$channelBox.Text,
  'Target='+$targetBox.Text,
  'Edition='+$editionBox.Text,
  'Architecture='+$archBox.Text
 ) | Set-Content -Path $script:Config -Encoding UTF8
 Log "Zapisano ustawienia programu: $script:Config"
}
function New-Label($parent,$text,$x,$y,$w,$h=24) {
 $l=New-Object System.Windows.Forms.Label
 $l.Text=$text;$l.Location=New-Object System.Drawing.Point($x,$y);$l.Size=New-Object System.Drawing.Size($w,$h)
 $parent.Controls.Add($l);return $l
}
function New-Combo($parent,$items,$x,$y,$w) {
 $c=New-Object System.Windows.Forms.ComboBox
 $c.DropDownStyle='DropDownList';$c.Location=New-Object System.Drawing.Point($x,$y);$c.Size=New-Object System.Drawing.Size($w,25)
 foreach($i in $items){[void]$c.Items.Add($i)}
 if($c.Items.Count -gt 0){$c.SelectedIndex=0}
 $parent.Controls.Add($c);return $c
}
function New-Button($parent,$text,$x,$y,$w,$handler) {
 $b=New-Object System.Windows.Forms.Button
 $b.Text=$text;$b.Location=New-Object System.Drawing.Point($x,$y);$b.Size=New-Object System.Drawing.Size($w,34)
 $b.FlatStyle='Flat';$b.BackColor=[System.Drawing.Color]::FromArgb(22,135,201);$b.ForeColor=[System.Drawing.Color]::White
 $b.Add_Click($handler);$parent.Controls.Add($b);return $b
}
function Apply-Theme {
 $t=$script:Themes | Where-Object {$_.Name -eq $script:CurrentTheme} | Select-Object -First 1
 if(!$t){return}
 $form.BackColor=[System.Drawing.ColorTranslator]::FromHtml($t.Back)
 foreach($c in $form.Controls) {
  if($c -is [System.Windows.Forms.TabControl]) {
   foreach($tp in $c.TabPages) {
    $tp.BackColor=[System.Drawing.ColorTranslator]::FromHtml($t.Back)
    foreach($x in $tp.Controls) {
     if($x -is [System.Windows.Forms.GroupBox]){$x.BackColor=[System.Drawing.ColorTranslator]::FromHtml($t.Panel);$x.ForeColor=[System.Drawing.ColorTranslator]::FromHtml($t.Fore)}
     elseif($x -is [System.Windows.Forms.Label]){$x.ForeColor=[System.Drawing.ColorTranslator]::FromHtml($t.Fore)}
     elseif($x -is [System.Windows.Forms.Button]){$x.BackColor=[System.Drawing.ColorTranslator]::FromHtml($t.Accent);$x.ForeColor=[System.Drawing.Color]::White}
    }
   }
  } elseif($c -is [System.Windows.Forms.Label]){$c.ForeColor=[System.Drawing.ColorTranslator]::FromHtml($t.Fore)}
 }
 if($script:LogBox){$script:LogBox.BackColor=[System.Drawing.ColorTranslator]::FromHtml($t.Panel);$script:LogBox.ForeColor=[System.Drawing.ColorTranslator]::FromHtml($t.Fore)}
}
function Get-OSFamily([string]$caption) {
 if($caption -match 'Windows XP'){return 'XP'}
 if($caption -match 'Windows Vista'){return 'Vista'}
 if($caption -match 'Windows 7'){return '7'}
 if($caption -match 'Windows 8.1'){return '8.1'}
 if($caption -match 'Windows 8'){return '8'}
 if($caption -match 'Windows 10'){return '10'}
 if($caption -match 'Windows 11'){return '11'}
 return 'Unknown'
}
function Get-MigrationPlan {
 $src=Get-OSFamily $script:OS.Caption
 $dst=$targetBox.Text
 $plan=@()
 $plan += "System wykryty: $($script:OS.Caption) (rodzina $src)"
 $plan += "Cel: Windows $dst"
 if($src -eq 'XP') {
  if($dst -eq '7'){$plan += 'XP -> Windows 7: instalacja niestandardowa / czysta. Programy i ustawienia nie zostaną przeniesione.'}
  elseif($dst -eq '10' -or $dst -eq '11'){$plan += "XP -> Windows ${dst}: brak obsługiwanej aktualizacji bezpośredniej. Kopia danych i czysta instalacja docelowego systemu."}
  else{$plan += "XP -> Windows ${dst}: wymagany nośnik instalacyjny, sprawdzenie sterowników i najpewniej czysta instalacja."}
 } elseif($src -eq 'Vista') {
  $plan += "Vista -> Windows ${dst}: bezpośrednia ścieżka zachowania aplikacji nie jest zakładana. Wykonaj kopię i przygotuj instalację niestandardową."
 } elseif($src -eq '7') {
  if($dst -eq '10'){$plan += 'Windows 7 SP1 -> Windows 10: aktualizacja może być możliwa z właściwym nośnikiem, zgodnym językiem/architekturą/edycją i sterownikami; sprawdź Setup.'}
  elseif($dst -eq '11'){$plan += 'Windows 7 -> Windows 11: zaplanuj kopię i czystą instalację; brak wspieranej bezpośredniej ścieżki uaktualnienia.'}
  else{$plan += "Windows 7 -> Windows ${dst}: sprawdź dokładną ścieżkę i nośnik; program nie zakłada zachowania aplikacji."}
 } elseif($src -eq '8') {
  if($dst -eq '10'){$plan += 'Windows 8 -> Windows 10: najpierw zainstaluj Windows 8.1 Update, a następnie oceniaj zgodność uaktualnienia.'}
  elseif($dst -eq '11'){$plan += 'Windows 8 -> Windows 11: zalecana kopia i czysta instalacja; brak wspieranej bezpośredniej ścieżki.'}
  else{$plan += 'Sprawdź wydanie pośrednie, aktualizacje i nośnik instalacyjny.'}
 } elseif($src -eq '8.1') {
  if($dst -eq '10'){$plan += 'Windows 8.1 -> Windows 10: możliwość aktualizacji zależy od zgodności obrazu, edycji, języka, architektury i sterowników.'}
  elseif($dst -eq '11'){$plan += 'Windows 8.1 -> Windows 11: zalecana czysta instalacja po kopii danych i diagnostyce sprzętu.'}
  else{$plan += 'Sprawdź edycję, język, architekturę i wymagania instalatora.'}
 } elseif($src -eq '10') {
  if($dst -eq '11'){$plan += 'Windows 10 -> Windows 11: aktualizacja w miejscu, jeśli zgodność sprzętowa i ścieżka wydania są potwierdzone. Dla nieobsługiwanego sprzętu dostępny jest osobny tryb eksperymentalny.'}
  else{$plan += "Windows 10 -> Windows ${dst}: może wymagać czystej instalacji; downgrade nie jest standardową aktualizacją."}
 } elseif($src -eq '11') {
  $plan += 'Windows 11: przejście do starszego wydania zwykle wymaga czystej instalacji poza ograniczonym okresem wycofania.'
 } else {
  $plan += 'Nie rozpoznano rodziny systemu. Wykonaj kopię i użyj instalatora zgodnego z tym komputerem.'
 }
 $plan += 'Zawsze: kopia danych, klucz odzyskiwania BitLocker (jeśli występuje), sterowniki sieci/chipsetu, wolne miejsce i zasilanie.'
 return $plan
}
function Show-MigrationPlan {
 $p=Get-MigrationPlan
 $text=$p -join "`r`n`r`n"
 $path=Join-Path $script:Root ("Plan_migracji_"+(Get-Date -Format yyyyMMdd_HHmmss)+'.txt')
 $text | Set-Content $path -Encoding UTF8
 Log "Utworzono plan migracji: $path"
 [System.Windows.Forms.MessageBox]::Show($text,'Plan migracji Windows') | Out-Null
}
function Open-OfficialSource {
 $dst=$targetBox.Text
 $ch=$channelBox.Text
 if($ch -eq 'Stable / normalny') {
  if($dst -eq '10'){$url='https://www.microsoft.com/software-download/windows10'}
  elseif($dst -eq '11'){$url='https://www.microsoft.com/software-download/windows11'}
  else{$url=''}
 } elseif($ch -eq 'Release Preview') {$url='https://www.microsoft.com/windowsinsider'}
 elseif($ch -eq 'Beta') {$url='https://www.microsoft.com/windowsinsider'}
 elseif($ch -eq 'Experimental (dawniej Dev/Canary)') {$url='https://www.microsoft.com/windowsinsider'}
 else {$url='https://www.microsoft.com/software-download/windows11'}
 if($url -eq '') {
  [System.Windows.Forms.MessageBox]::Show('Dla Windows XP/Vista/7/8/8.1 użyj własnego oryginalnego nośnika i ważnej licencji. Microsoft nie udostępnia już dla wszystkich tych starych wersji zwykłego publicznego pobierania ISO. Nie pobieraj obrazów z nieznanych serwisów.','Starszy Windows') | Out-Null
  Log "Dla Windows $dst wymagany jest oryginalny nośnik/licencja."
 } else {Log "Otwieram oficjalne źródło: $url";Start-Process $url}
}
function Browse-Setup {
 $d=New-Object System.Windows.Forms.OpenFileDialog
 $d.Title='Wskaż setup.exe na oryginalnym DVD/USB/rozpakowanym nośniku Windows'
 $d.Filter='Windows Setup (setup.exe)|setup.exe|Wszystkie pliki (*.*)|*.*'
 $d.FileName='setup.exe'
 if($d.ShowDialog() -eq 'OK') {
  $script:SetupExe=$d.FileName
  $setupPathLabel.Text=$script:SetupExe
  Log "Wybrano instalator: $script:SetupExe"
 }
}
function Verify-Iso {
 $d=New-Object System.Windows.Forms.OpenFileDialog
 $d.Title='Wybierz plik ISO do obliczenia SHA-256'
 $d.Filter='Obraz ISO (*.iso)|*.iso'
 if($d.ShowDialog() -eq 'OK') {
  $script:IsoPath=$d.FileName
  try {
   $h=Get-FileHash -LiteralPath $script:IsoPath -Algorithm SHA256 -ErrorAction Stop
   $hashLabel.Text=$h.Hash
   Log "SHA-256 ISO: $($h.Hash)"
   Log 'Hash porównaj z oficjalną wartością dla identycznego wydania, języka i architektury.'
  } catch {
   # PowerShell 2.0 fallback: certutil.exe
   $out=& certutil.exe -hashfile "$($script:IsoPath)" SHA256 2>&1
   $hashLabel.Text=($out | Where-Object {$_ -match '^[0-9a-fA-F ]{32,}$'} | Select-Object -First 1)
   Log 'Obliczono SHA-256 przez certutil (sprawdź wynik w polu).'
  }
 }
}
function Launch-Setup {
 if(!$script:SetupExe -or !(Test-Path $script:SetupExe)) {
  [System.Windows.Forms.MessageBox]::Show('Najpierw wskaż setup.exe z oryginalnego DVD/USB lub zamontowanego obrazu.','Brak instalatora') | Out-Null
  return
 }
 $family=Get-OSFamily $script:OS.Caption
 $warning='Windows Setup zostanie uruchomiony interaktywnie. Przed zatwierdzeniem sprawdź, czy oferuje zachowanie plików i aplikacji. Jeśli nie — anuluj, jeżeli nie chcesz czystej instalacji.'
 if($family -eq 'XP' -or $family -eq 'Vista' -or $family -eq '7' -or $family -eq '8' -or $family -eq '8.1') {
  $warning += "`r`n`r`nNa starym systemie przejście do nowszego Windows może wymagać instalacji niestandardowej. Programy i ustawienia mogą nie zostać zachowane."
 }
 if([System.Windows.Forms.MessageBox]::Show($warning,'Potwierdź uruchomienie instalatora','YesNo','Warning') -ne 'Yes'){return}
 try {Log 'Uruchamiam instalator w trybie interaktywnym.';Start-Process -FilePath $script:SetupExe}
 catch {Log "Nie udało się uruchomić instalatora: $($_.Exception.Message)"}
}
function Run-SetupScan {
 if(!$script:SetupExe -or !(Test-Path $script:SetupExe)){Log 'Najpierw wskaż setup.exe.';return}
 $family=Get-OSFamily $script:OS.Caption
 if($family -eq 'XP' -or $family -eq 'Vista' -or $family -eq '7' -or $family -eq '8' -or $family -eq '8.1') {
  Log 'Skan /compat scanonly jest przeznaczony dla nowszego Windows Setup. Na starym systemie sprawdź instalator ręcznie.'
  return
 }
 $dir=Join-Path $script:Root ("SetupCompat_"+(Get-Date -Format yyyyMMdd_HHmmss))
 New-Item -ItemType Directory -Path $dir -Force | Out-Null
 try {
  $p=Start-Process -FilePath $script:SetupExe -ArgumentList @('/auto upgrade','/quiet','/compat scanonly',"/copylogs `"$dir`"") -Wait -PassThru
  $code='0x{0:X8}' -f ($p.ExitCode -band 0xffffffff)
  Log "Kod skanowania zgodności: $code; raport: $dir"
 } catch {Log "Nie udało się uruchomić skanowania: $($_.Exception.Message)"}
}
function Get-HardwareReport {
 $cpu=Get-WmiObject Win32_Processor | Select-Object -First 1
 $cs=Get-WmiObject Win32_ComputerSystem
 $bios=Get-WmiObject Win32_BIOS | Select-Object -First 1
 $ram=[math]::Round($cs.TotalPhysicalMemory/1GB,1)
 $disk=Get-WmiObject Win32_LogicalDisk -Filter "DeviceID='$env:SystemDrive'"
 $free='nieznane'
 if($disk){$free=[math]::Round($disk.FreeSpace/1GB,1)}
 $tpm='nie wykryto / brak dostępu'
 try {
  $t=Get-WmiObject -Namespace 'root\CIMV2\Security\MicrosoftTpm' -Class Win32_Tpm -ErrorAction Stop
  if($t){$tpm='WMI TPM wykryty'}
 } catch {}
 $sb='nieznany (zależny od firmware)'
 try {
  $sbv=Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\SecureBoot\State' -ErrorAction Stop
  if($sbv.UEFISecureBootEnabled -eq 1){$sb='włączony'}elseif($sbv.UEFISecureBootEnabled -eq 0){$sb='wyłączony'}
 } catch {}
 $rep=@"
RAPORT KOMPUTEROWE CENTRUM SERWISU
Data: $(Get-Date)
Windows: $($script:OS.Caption)
Wersja: $($script:OS.Version)
Kompilacja: $($script:OS.Build)
Service Pack: $($script:OS.SP)
Architektura systemu: $($script:OS.Arch)
Procesor: $($cpu.Name)
RAM: $ram GB
Wolne miejsce na dysku systemowym: $free GB
TPM: $tpm
Secure Boot: $sb
BIOS: $($bios.SMBIOSBIOSVersion)
Producent/model: $($cs.Manufacturer) $($cs.Model)
"@
 $path=Join-Path $script:Root ("Raport_sprzetu_"+(Get-Date -Format yyyyMMdd_HHmmss)+'.txt')
 $rep | Set-Content $path -Encoding UTF8
 Log "Raport zapisany: $path"
 [System.Windows.Forms.MessageBox]::Show($rep,'Raport sprzętu') | Out-Null
}
function Export-Drivers {
 $family=Get-OSFamily $script:OS.Caption
 if($family -ne '10' -and $family -ne '11') {
  [System.Windows.Forms.MessageBox]::Show('Eksport sterowników jednym poleceniem pnputil jest w tym programie dostępny dla Windows 10/11. Na starszych wersjach użyj narzędzi producenta lub DISM odpowiedniego dla systemu.','Ograniczenie systemu') | Out-Null
  return
 }
 $dest=Join-Path $script:Root ("Sterowniki_"+(Get-Date -Format yyyyMMdd_HHmmss))
 New-Item -ItemType Directory -Path $dest -Force | Out-Null
 try {$p=Start-Process pnputil.exe -ArgumentList @('/export-driver','*',$dest) -Wait -PassThru -NoNewWindow;Log "Eksport sterowników: kod $($p.ExitCode), folder $dest"}
 catch {Log "Błąd eksportu sterowników: $($_.Exception.Message)"}
}
function Create-LabConfig {
 $out=Join-Path $script:Root 'Windows11_Unsupported_Hardware_LabConfig.reg'
 $reg=@'
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\SYSTEM\Setup\LabConfig]
"BypassTPMCheck"=dword:00000001
"BypassSecureBootCheck"=dword:00000001
"BypassRAMCheck"=dword:00000001
"BypassCPUCheck"=dword:00000001
'@
 Set-Content -Path $out -Value $reg -Encoding Unicode
 $guide=Join-Path $script:Root 'INSTRUKCJA_OBEJSCIA_W11.txt'
 @"
OBEJSCIE KONTROLI SPRZETOWYCH WINDOWS 11 - TRYB EKSPERYMENTALNY
Plik rejestru: $out

ZASTRZEZENIE:
Microsoft nie zaleca instalowania Windows 11 na urządzeniach niespełniających wymagań. Taki komputer nie będzie wspierany przez Microsoft i aktualizacje, także zabezpieczeń, nie są gwarantowane. Mogą wystąpić problemy ze zgodnością. Używasz tej metody na własną odpowiedzialność.

INSTALACJA CZYSTA Z USB:
1. Wykonaj kopię danych.
2. Utwórz nośnik Windows 11 z oficjalnego ISO Microsoft.
3. Skopiuj plik Windows11_Unsupported_Hardware_LabConfig.reg na pendrive.
4. Uruchom komputer z USB i przejdź do pierwszego ekranu instalatora.
5. Naciśnij Shift+F10, aby otworzyć CMD.
6. Ustal literę pendrive (np. dir D:\, dir E:\).
7. Wpisz: regedit
8. W Edytorze rejestru wybierz Plik > Importuj i wskaż plik REG z pendrive.
9. Zamknij edytor i wróć do instalatora. Kontrole mogą nadal blokować instalację.

AKTUALIZACJA Z WINDOWS 10:
Przycisk „Przygotuj MoSetup” tworzy osobną kopię klucza rejestru i ustawia wartość AllowUpgradesWithUnsupportedTPMOrCPU=1. To ustawienie nie omija wszystkich wymagań ani blokad i nie daje gwarancji instalacji.

Nie pomija aktywacji ani licencji. Nie usuwa danych automatycznie.
"@ | Set-Content $guide -Encoding UTF8
 Log "Utworzono plik LabConfig REG i instrukcję: $out"
 [System.Windows.Forms.MessageBox]::Show("Utworzono pliki:`r`n$out`r`n$guide`r`n`r`nPlik trzeba zaimportować w środowisku instalatora. Program nie stosuje tej zmiany automatycznie.",'Gotowe') | Out-Null
}
function Prepare-MoSetup {
 $identity=[Security.Principal.WindowsIdentity]::GetCurrent()
 $principal=New-Object Security.Principal.WindowsPrincipal($identity)
 if(-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  [System.Windows.Forms.MessageBox]::Show('Uruchom START.cmd jako Administrator, a następnie ponów tę operację.','Wymagane uprawnienia') | Out-Null
  return
 }
 $family=Get-OSFamily $script:OS.Caption
 if($family -ne '10') {
  [System.Windows.Forms.MessageBox]::Show('Wartość MoSetup dotyczy scenariusza aktualizacji z Windows 10. Dla czystej instalacji użyj pliku LabConfig z instrukcji.','Nieobsługiwany scenariusz') | Out-Null
  return
 }
 $msg='Ustawienie AllowUpgradesWithUnsupportedTPMOrCPU=1 może umożliwić przejście kontroli CPU/TPM w niektórych scenariuszach. Nie omija wszystkich blokad i nie oznacza wsparcia. Wykonać kopię klucza i ustawić wartość?'
 if([System.Windows.Forms.MessageBox]::Show($msg,'OBEJŚCIE — OSTRZEŻENIE','YesNo','Warning') -ne 'Yes'){return}
 $key='HKLM\SYSTEM\Setup\MoSetup'
 $backup=Join-Path $script:Root ("MoSetup_backup_"+(Get-Date -Format yyyyMMdd_HHmmss)+'.reg')
 & reg.exe export $key $backup /y | Out-Null
 New-Item -Path 'HKLM:\SYSTEM\Setup\MoSetup' -Force | Out-Null
 New-ItemProperty -Path 'HKLM:\SYSTEM\Setup\MoSetup' -Name 'AllowUpgradesWithUnsupportedTPMOrCPU' -PropertyType DWord -Value 1 -Force | Out-Null
 Log "Ustawiono MoSetup. Kopia rejestru: $backup"
}
function Run-Repair($cmd) {
 Log "Otwieram narzędzie: $cmd"
 Start-Process cmd.exe -ArgumentList "/k $cmd" -Verb RunAs
}
function Open-DataFolder {Start-Process explorer.exe $script:Root}

Load-Config
$script:OS=Get-OSInfo
$form=New-Object System.Windows.Forms.Form
$form.Text='KOMPUTEROWE CENTRUM SERWISU | TRYB ZGODNOŚCI'
$form.Size=New-Object System.Drawing.Size(1100,820)
$form.MinimumSize=New-Object System.Drawing.Size(1040,760)
$form.StartPosition='CenterScreen';$form.Font=New-Object System.Drawing.Font('Segoe UI',9)

$head=New-Object System.Windows.Forms.Label
$head.Text='KOMPUTEROWE CENTRUM SERWISU'
$head.Font=New-Object System.Drawing.Font('Segoe UI',17,[System.Drawing.FontStyle]::Bold)
$head.ForeColor=[System.Drawing.Color]::FromArgb(55,190,255);$head.Location='18,10';$head.Size='850,34';$form.Controls.Add($head)
$info=New-Object System.Windows.Forms.Label
$info.Text="FIX046 — TRYB ZGODNOŚCI • Wykryto: $($script:OS.Caption) • $($script:OS.Arch) • SP $($script:OS.SP)"
$info.Location='21,48';$info.Size='820,22';$form.Controls.Add($info)

$skin=New-Combo $form ($script:Themes | ForEach-Object {$_.Name}) 885 13 180
$skin.SelectedItem=$script:CurrentTheme
$skin.Add_SelectedIndexChanged({$script:CurrentTheme=$skin.Text;Apply-Theme;Save-Config})

$tabs=New-Object System.Windows.Forms.TabControl
$tabs.Location='18,80';$tabs.Size='1050,670';$form.Controls.Add($tabs)

$tabMig=New-Object System.Windows.Forms.TabPage
$tabMig.Text='Migracja XP–11';[void]$tabs.TabPages.Add($tabMig)
$gSource=New-Object System.Windows.Forms.GroupBox
$gSource.Text='SYSTEM WYKRYTY AUTOMATYCZNIE';$gSource.Location='12,12';$gSource.Size='1005,75';$tabMig.Controls.Add($gSource)
New-Label $gSource "$($script:OS.Caption) | wersja $($script:OS.Version) | build $($script:OS.Build) | SP $($script:OS.SP) | architektura $($script:OS.Arch)" 16 25 970 35 | Out-Null
$gChoice=New-Object System.Windows.Forms.GroupBox
$gChoice.Text='WYBIERZ SYSTEM DOCELOWY';$gChoice.Location='12,98';$gChoice.Size='1005,155';$tabMig.Controls.Add($gChoice)
New-Label $gChoice 'Windows docelowy' 18 30 135 | Out-Null
$targetBox=New-Combo $gChoice @('11','10','8.1','8','7') 160 27 170
New-Label $gChoice 'Edycja' 355 30 65 | Out-Null
$editionBox=New-Combo $gChoice @('Automatycznie z nośnika','Home','Pro','Education','Enterprise','LTSC') 425 27 230
New-Label $gChoice 'Architektura' 680 30 90 | Out-Null
$archBox=New-Combo $gChoice @('Automatyczna / zgodna z nośnikiem','x64','x86','ARM64') 775 27 210
New-Label $gChoice 'Kanał systemu' 18 82 135 | Out-Null
$channelBox=New-Combo $gChoice @('Stable / normalny','Release Preview','Beta','Experimental (dawniej Dev/Canary)','Dev (kanał legacy)','Canary (kanał legacy)') 160 79 315
New-Label $gChoice 'Kanał programu' 500 82 115 | Out-Null
$programChannelBox=New-Combo $gChoice @('Stable / normalna wersja','Beta / testowa') 620 79 250
New-Button $gChoice 'Zapisz ustawienia' 18 116 160 {Save-Config} | Out-Null
New-Button $gChoice 'Pokaż plan migracji' 190 116 190 {Show-MigrationPlan} | Out-Null
New-Button $gChoice 'Oficjalne źródło / ISO' 392 116 190 {Open-OfficialSource} | Out-Null
New-Label $gChoice 'Kanały Insider i dostępność buildów zależą od Microsoft Account, urządzenia i aktualnego programu Insider.' 595 121 390 30

$gSetup=New-Object System.Windows.Forms.GroupBox
$gSetup.Text='NOŚNIK INSTALACYJNY';$gSetup.Location='12,265';$gSetup.Size='1005,135';$tabMig.Controls.Add($gSetup)
$setupPathLabel=New-Label $gSetup 'Nie wybrano setup.exe. Możesz wskazać plik z DVD, USB lub zamontowanego ISO.' 16 25 965 25
New-Button $gSetup 'Wskaż setup.exe' 18 58 170 {Browse-Setup} | Out-Null
New-Button $gSetup 'Sprawdź zgodność' 200 58 170 {Run-SetupScan} | Out-Null
New-Button $gSetup 'Uruchom instalator' 382 58 180 {Launch-Setup} | Out-Null
$hashLabel=New-Label $gSetup 'SHA-256 ISO: jeszcze nie obliczono' 18 100 965 22
New-Button $gSetup 'Oblicz SHA-256 ISO' 575 58 190 {Verify-Iso} | Out-Null
New-Label $tabMig 'Dla Windows XP/Vista/7/8 starsze nośniki trzeba dostarczyć samodzielnie. Program nie udostępnia pirackich obrazów ani kluczy.' 18 420 1000 32 | Out-Null

$tabCompat=New-Object System.Windows.Forms.TabPage
$tabCompat.Text='Diagnostyka i bypass';[void]$tabs.TabPages.Add($tabCompat)
$gHardware=New-Object System.Windows.Forms.GroupBox
$gHardware.Text='DIAGNOSTYKA SPRZĘTU';$gHardware.Location='12,12';$gHardware.Size='1005,120';$tabCompat.Controls.Add($gHardware)
New-Button $gHardware 'Generuj raport sprzętu' 18 35 210 {Get-HardwareReport} | Out-Null
New-Button $gHardware 'Otwórz folder danych' 242 35 190 {Open-DataFolder} | Out-Null
New-Label $gHardware 'Raport: CPU, RAM, wolne miejsce, TPM, Secure Boot, BIOS, producent, model, Windows i architektura.' 18 82 960 22 | Out-Null
$gBypass=New-Object System.Windows.Forms.GroupBox
$gBypass.Text='WINDOWS 11 NA NIEOBSŁUGIWANYM SPRZĘCIE — EKSPERYMENTALNE';$gBypass.Location='12,145';$gBypass.Size='1005,210';$tabCompat.Controls.Add($gBypass)
New-Label $gBypass 'Czysta instalacja z USB: wygeneruj plik LabConfig.reg. W środowisku instalatora użyj Shift+F10 → regedit → Plik/Importuj. Instrukcja zostanie zapisana obok pliku.' 18 25 960 50 | Out-Null
New-Button $gBypass 'Utwórz LabConfig.reg + instrukcję' 18 85 290 {Create-LabConfig} | Out-Null
New-Label $gBypass 'Aktualizacja uruchomiona z Windows 10: opcjonalny klucz MoSetup (tylko TPM/CPU; nie omija wszystkich blokad).' 18 132 960 35 | Out-Null
New-Button $gBypass 'Przygotuj MoSetup dla Windows 10' 18 168 290 {Prepare-MoSetup} | Out-Null

$tabTools=New-Object System.Windows.Forms.TabPage
$tabTools.Text='Narzędzia serwisowe';[void]$tabs.TabPages.Add($tabTools)
$gTools=New-Object System.Windows.Forms.GroupBox
$gTools.Text='NAPRAWA I ZABEZPIECZENIE';$gTools.Location='12,12';$gTools.Size='1005,170';$tabTools.Controls.Add($gTools)
New-Button $gTools 'DISM RestoreHealth' 18 35 190 {Run-Repair 'DISM.exe /Online /Cleanup-Image /RestoreHealth'} | Out-Null
New-Button $gTools 'SFC /scannow' 220 35 160 {Run-Repair 'sfc.exe /scannow'} | Out-Null
New-Button $gTools 'CHKDSK C: /scan' 390 35 180 {Run-Repair 'chkdsk C: /scan'} | Out-Null
New-Button $gTools 'Eksport sterowników (10/11)' 580 35 230 {Export-Drivers} | Out-Null
New-Label $gTools 'Narzędzia zależą od wersji systemu. Na XP/Vista nie wszystkie polecenia są dostępne. Zawsze sprawdzaj komunikaty w osobnym oknie.' 18 95 970 38 | Out-Null
$gLinks=New-Object System.Windows.Forms.GroupBox
$gLinks.Text='OFICJALNE INFORMACJE';$gLinks.Location='12,195';$gLinks.Size='1005,130';$tabTools.Controls.Add($gLinks)
New-Button $gLinks 'Wymagania Windows 11' 18 35 220 {Start-Process 'https://www.microsoft.com/windows/windows-11-specifications'} | Out-Null
New-Button $gLinks 'Windows Insider' 250 35 180 {Start-Process 'https://www.microsoft.com/windowsinsider'} | Out-Null
New-Button $gLinks 'Windows 11 Release Health' 442 35 220 {Start-Process 'https://learn.microsoft.com/windows/release-health/windows11-release-information'} | Out-Null
New-Button $gLinks 'Otwórz raporty' 675 35 160 {Open-DataFolder} | Out-Null

$tabLog=New-Object System.Windows.Forms.TabPage
$tabLog.Text='Dziennik';[void]$tabs.TabPages.Add($tabLog)
$script:LogBox=New-Object System.Windows.Forms.TextBox
$script:LogBox.Location='12,12';$script:LogBox.Size='1005,545';$script:LogBox.Multiline=$true;$script:LogBox.ReadOnly=$true;$script:LogBox.ScrollBars='Vertical'
$script:LogBox.Font=New-Object System.Drawing.Font('Consolas',9);$tabLog.Controls.Add($script:LogBox)
New-Button $tabLog 'Otwórz folder danych' 18 570 190 {Open-DataFolder} | Out-Null
New-Button $tabLog 'Zapisz konfigurację' 220 570 190 {Save-Config} | Out-Null

$foot=New-Object System.Windows.Forms.Label
$foot.Text='UWAGA: brak gwarancji działania na każdym komputerze. Nieobsługiwany Windows 11 może nie otrzymywać aktualizacji; wykonaj kopię danych przed każdą migracją.'
$foot.ForeColor=[System.Drawing.Color]::FromArgb(230,160,80);$foot.Location='20,758';$foot.Size='1045,28';$form.Controls.Add($foot)

Apply-Theme
Log "FIX046 — TRYB ZGODNOŚCI uruchomiony."
Log "Wykryto: $($script:OS.Caption); architektura: $($script:OS.Arch); build: $($script:OS.Build)."
Log 'Kanał Insider: Stable, Release Preview, Beta, Experimental (dawniej Dev/Canary), legacy Dev i Canary.'
Log 'Na XP/Vista użyj START.cmd; jeżeli PowerShell nie jest zainstalowany, launcher uruchamia tryb Legacy HTA.'
$form.Add_FormClosing({try{Save-Config}catch{}})
[void]$form.ShowDialog()
