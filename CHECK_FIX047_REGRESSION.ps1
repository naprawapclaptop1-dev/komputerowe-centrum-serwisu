$ErrorActionPreference = "Stop"
$main = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "WindowsVersionSwitcherPRO.cs"))
$modules = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "WindowsVersionSwitcherPRO.Modules.cs"))
$verify = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "VERIFY_PAYLOAD.ps1"))
$assembly = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "AssemblyInfo.cs"))
$setup = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "SETUP_MODERN.iss"))
$product = 'KOMPUTEROWE CENTRUM SERWISU'
if ($main -notmatch [regex]::Escape($product)) { throw "FIX047: new Polish product name missing from application source." }
if ($main -match 'NAPRAWA PC') { throw "FIX047: old visible product name remains in the main application source." }
if ($modules -match 'NAPRAWA PC') { throw "FIX047: old visible product name remains in module/report text." }
if ($assembly -notmatch [regex]::Escape($product)) { throw "FIX047: new product name missing from assembly metadata." }
if ($setup -notmatch [regex]::Escape($product)) { throw "FIX047: new product name missing from installer." }
if ($main -notmatch 'Text = "KOMPUTEROWE CENTRUM SERWISU"') { throw "FIX047: clean application window title missing." }
if ($main -notmatch 'brand.Text="KOMPUTEROWE\\r\\nCENTRUM SERWISU"') { throw "FIX047: two-line sidebar brand missing." }
if ($main -notmatch 'headerBrand.Text="KOMPUTEROWE CENTRUM SERWISU"') { throw "FIX047: header brand missing." }
if ($main -notmatch 'e.Index>=0\?Convert.ToString\(box.Items\[e.Index\]\)') { throw "FIX047: owner-drawn ComboBox selected value drawing missing." }
if ($main -notmatch 'int quickY=514,quickH=126') { throw "FIX047: compact responsive dashboard layout missing." }
if ($main -notmatch 'PŁYTA GŁÓWNA I ROZRUCH' -or $main -notmatch 'ZADANIA I KONTROLA JAKOŚCI') { throw "FIX047: dashboard status panels missing." }
foreach ($style in @('PROFESJONALNY','FUTURYSTYCZNY','SZKLANY')) { if ($main -notmatch [regex]::Escape($style)) { throw "FIX047: interface style missing: $style" } }
foreach ($theme in @('GRANATOWY','TURKUSOWY','FIOLETOWY','SZMARAGDOWY','LODOWY','GRAFITOWY','BURSZTYNOWY','RUBINOWY',('S' + [char]0x0141 + 'ONECZNY'),'OCEANICZNY')) { if ($main -notmatch [regex]::Escape($theme)) { throw "FIX047: theme missing: $theme" } }
foreach ($pattern in @('BuildPcMigrationTransferPage','ExportPcMigrationPackage','VerifyPcMigrationPackage','ImportPcMigrationPackage','PcMigrationHash','FileAttributes.ReparsePoint')) { if ($modules -notmatch $pattern) { throw "FIX047: migration safeguard missing: $pattern" } }
if ($verify -notmatch 'CHECK_FIX047_REGRESSION\.ps1') { throw "FIX047: source-bound regression test reference missing." }
if ($assembly -notmatch '\[assembly:\s*AssemblyVersion\("1\.0\.0\.47"\)\]' -or $assembly -notmatch '\[assembly:\s*AssemblyFileVersion\("1\.0\.0\.47"\)\]') { throw "FIX047: assembly version mismatch." }
if ($main -notmatch 'BuildNavigationGroups' -or $main -notmatch 'FilterNavigation' -or $main -notmatch 'ProcessCmdKey') { throw "FIX047: grouped searchable navigation / Ctrl+K missing." }
$navCount = [regex]::Matches($main,'AddNav\("[^"]+"').Count
$routeCount = [regex]::Matches($main,'if\(id=="[^"]+"\)').Count
if ($navCount -ne 62 -or $routeCount -ne 62) { throw "FIX047: module route count mismatch: nav=$navCount routes=$routeCount" }
Write-Output "[PASS] FIX047 Polish product identity, redesigned dashboard, custom selectors, 62 routes, 3 styles, 10 themes and migration safeguards verified."
