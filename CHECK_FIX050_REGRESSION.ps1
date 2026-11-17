$ErrorActionPreference = "Stop"
$main = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "WindowsVersionSwitcherPRO.cs"))
$modules = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "WindowsVersionSwitcherPRO.Modules.cs"))
$verify = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "VERIFY_PAYLOAD.ps1"))
$assembly = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "AssemblyInfo.cs"))
$fallback = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "WindowsVersionSwitcherPRO_LegacyFallback.ps1"))
$legacy = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "LegacyMode.hta"))
$setup = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "SETUP_MODERN.iss"))
$product = 'KOMPUTEROWE CENTRUM SERWISU'
if ($main -notmatch [regex]::Escape($product)) { throw "FIX050: new Polish product name missing from application source." }
if ($main -match 'NAPRAWA PC') { throw "FIX050: old visible product name remains in the main application source." }
if ($modules -match 'NAPRAWA PC') { throw "FIX050: old visible product name remains in module/report text." }
if ($modules -notmatch '<title>Komputerowe Centrum Serwisu - raport serwisowy</title>') { throw "FIX050: Polish service report title missing." }
if ($fallback.Contains('$form.Text=''NAPRAWA PC') -or $fallback.Contains('$head.Text=''NAPRAWA PC') -or $fallback.Contains('RAPORT NAPRAWA PC')) { throw "FIX050: old visible name remains in compatibility mode." }
if ($legacy.Contains('applicationname="Naprawa PC')) { throw "FIX050: old application name remains in HTA compatibility mode." }
if ($assembly -notmatch [regex]::Escape($product)) { throw "FIX050: new product name missing from assembly metadata." }
if ($setup -notmatch [regex]::Escape($product)) { throw "FIX050: new product name missing from installer." }
if ($main -notmatch 'Text = "KOMPUTEROWE CENTRUM SERWISU"') { throw "FIX050: clean application window title missing." }
if ($main -notmatch 'brand.Text="KOMPUTEROWE\\r\\nCENTRUM SERWISU"') { throw "FIX050: two-line sidebar brand missing." }
if ($main -notmatch 'headerBrand.Text="KOMPUTEROWE CENTRUM SERWISU"') { throw "FIX050: header brand missing." }
if ($main -notmatch 'e.Index>=0\?Convert.ToString\(box.Items\[e.Index\]\)') { throw "FIX050: owner-drawn ComboBox selected value drawing missing." }
if ($main -notmatch 'int quickY=514,quickH=126') { throw "FIX050: compact responsive dashboard layout missing." }
if ($main -notmatch 'PŁYTA GŁÓWNA I ROZRUCH' -or $main -notmatch 'ZADANIA I KONTROLA JAKOŚCI') { throw "FIX050: dashboard status panels missing." }
foreach ($style in @('PROFESJONALNY','FUTURYSTYCZNY','SZKLANY')) { if ($main -notmatch [regex]::Escape($style)) { throw "FIX050: interface style missing: $style" } }
foreach ($theme in @('GRANATOWY','TURKUSOWY','FIOLETOWY','SZMARAGDOWY','LODOWY','GRAFITOWY','BURSZTYNOWY','RUBINOWY',('S' + [char]0x0141 + 'ONECZNY'),'OCEANICZNY')) { if ($main -notmatch [regex]::Escape($theme)) { throw "FIX050: theme missing: $theme" } }
foreach ($pattern in @('BuildPcMigrationTransferPage','ExportPcMigrationPackage','VerifyPcMigrationPackage','ImportPcMigrationPackage','PcMigrationHash','FileAttributes.ReparsePoint')) { if ($modules -notmatch $pattern) { throw "FIX050: migration safeguard missing: $pattern" } }
if ($verify -notmatch 'CHECK_FIX050_REGRESSION\.ps1') { throw "FIX050: source-bound regression test reference missing." }
$assemblyVersionMatch = [regex]::Match($assembly, '\[assembly:\s*AssemblyVersion\("(?<version>\d+(?:\.\d+){3})"\)\]')
$fileVersionMatch = [regex]::Match($assembly, '\[assembly:\s*AssemblyFileVersion\("(?<version>\d+(?:\.\d+){3})"\)\]')
$verifyVersionMatch = [regex]::Match($verify, '\[string\]\$ExpectedVersion\s*=\s*"(?<version>\d+(?:\.\d+){3})"')
if (-not $assemblyVersionMatch.Success -or -not $fileVersionMatch.Success -or -not $verifyVersionMatch.Success) { throw "FIX050: assembly/verifier version metadata missing." }
$assemblyVersion = $assemblyVersionMatch.Groups['version'].Value
$fileVersion = $fileVersionMatch.Groups['version'].Value
$verifyVersion = $verifyVersionMatch.Groups['version'].Value
if ($assemblyVersion -ne $fileVersion -or $fileVersion -ne $verifyVersion) { throw "FIX050: assembly and payload verifier versions differ: Assembly=$assemblyVersion File=$fileVersion Verify=$verifyVersion" }
if ($assemblyVersion -ne "1.0.0.50") { throw "FIX050: expected current release 1.0.0.50, got $assemblyVersion" }
if ($main -notmatch 'BuildNavigationGroups' -or $main -notmatch 'FilterNavigation' -or $main -notmatch 'ProcessCmdKey') { throw "FIX050: grouped searchable navigation / Ctrl+K missing." }
$navCount = [regex]::Matches($main,'AddNav\("[^"]+"').Count
$routeCount = [regex]::Matches($main,'if\(id=="[^"]+"\)').Count
if ($navCount -ne 62 -or $routeCount -ne 62) { throw "FIX050: module route count mismatch: nav=$navCount routes=$routeCount" }
Write-Output "[PASS] FIX050 Polish product identity, redesigned dashboard, custom selectors, 62 routes, 3 styles, 10 themes and migration safeguards verified."
