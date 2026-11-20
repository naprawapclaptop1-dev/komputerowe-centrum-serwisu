$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$mainPath = Join-Path $root 'WindowsVersionSwitcherPRO.cs'
$modulesPath = Join-Path $root 'WindowsVersionSwitcherPRO.Modules.cs'
$main = Get-Content -LiteralPath $mainPath -Raw -Encoding UTF8
$modules = Get-Content -LiteralPath $modulesPath -Raw -Encoding UTF8
$cmd = Get-Content -LiteralPath (Join-Path $root 'CHECK_SOURCE.cmd') -Raw -Encoding UTF8
$validator = Get-Content -LiteralPath (Join-Path $root 'VALIDATE_FIX100_PACKAGE.ps1') -Raw -Encoding UTF8
$allow = @(Get-Content -LiteralPath (Join-Path $root 'FIX099_SOURCE_ALLOWLIST.txt') -Encoding UTF8 | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$manifest = Get-Content -LiteralPath (Join-Path $root 'FIX099_POWERSHELL_MANIFEST.txt') -Raw -Encoding UTF8
$policy = Get-Content -LiteralPath (Join-Path $root 'CHECK_FIX119_PUBLISHED_RELEASE_PRESERVATION.ps1') -Raw -Encoding UTF8
$safeBlock = [regex]::Match($policy,'\$safePaths\s*=\s*@\((.*?)\)',[Text.RegularExpressions.RegexOptions]::Singleline).Groups[1].Value
$currentBlock = [regex]::Match($policy,'\$currentTagChanges\s*=\s*@\((.*?)\)',[Text.RegularExpressions.RegexOptions]::Singleline).Groups[1].Value
$version = (Get-Content -LiteralPath (Join-Path $root 'VERSION.txt') -Encoding UTF8 | Select-Object -First 1).Trim()
$assembly = Get-Content -LiteralPath (Join-Path $root 'AssemblyInfo.cs') -Raw -Encoding UTF8
$checks = @()
function Add-Check { param([bool]$Passed,[string]$Name); $script:checks += [pscustomobject]@{Passed=$Passed;Name=$Name} }
Add-Check ($main.Contains('private void SaveXmlSafely') -and $main.Contains('File.Replace(temporary,path,null)')) 'Persistent XML writes use a replace-based atomic save'
Add-Check ($main.Contains('FileMode.CreateNew') -and $main.Contains('stream.Flush(true)')) 'Temporary XML is exclusively created and flushed to disk before replacement'
Add-Check ($main.Contains('TryLoadXmlDocument') -and $main.Contains('DtdProcessing=DtdProcessing.Prohibit') -and $main.Contains('XmlResolver=null')) 'XML loading prohibits DTDs and external resolvers'
Add-Check ($main.Contains('64L*1024L*1024L') -and $main.Contains('1024L*1024L')) 'XML readers enforce separate general-data and settings size limits'
Add-Check ($main.Contains('SettingsAreEquivalentIgnoringTimestamp') -and $main.Contains('LastSavedUtc')) 'Timestamp-only writes do not create unnecessary configuration backup generations'
Add-Check ($main.Contains('.backup_') -and $main.Contains('TrimXmlBackups(path,keepBackups)')) 'Valid previous XML generations are kept in a bounded rotating backup set'
Add-Check ($main.Contains('.corrupt_') -and $main.Contains('File.Move(path,corrupt)')) 'Malformed original XML is preserved under a corrupt-file name, not overwritten silently'
Add-Check ($main.Contains('GetConfigBackupCandidates') -and $main.Contains('IsValidSettingsDocument(backup,out backupError)') -and $main.Contains('Odzyskano konfigurację z kopii')) 'Startup automatically searches and restores the newest valid configuration backup'
Add-Check ($main.Contains('WindowWidth') -and $main.Contains('WindowHeight') -and $main.Contains('WindowX') -and $main.Contains('WindowY') -and $main.Contains('WindowMaximized')) 'Window position, size and maximized state are persisted'
Add-Check ($main.Contains('LastPage') -and $main.Contains('IsKnownPageId(savedLastPage)')) 'Last opened module is restored only when it is a known navigation page'
Add-Check ($main.Contains('CustomBackupRoots') -and $main.Contains('customRoots.Count<40')) 'Additional backup folders are persisted with a strict maximum count'
Add-Check ($main.Contains('FormClosing += delegate') -and $main.Contains('CaptureWindowStateForConfig(); SaveConfig();')) 'Configuration is saved again when the application closes'
Add-Check ($modules.Contains('SPRAWDŹ KONFIGURACJĘ') -and $modules.Contains('PRZYWRÓĆ OSTATNIĄ KOPIĘ') -and $modules.Contains('OTWÓRZ KOPIE KONFIGURACJI')) 'Configuration page exposes validation, restore and backup-folder actions'
Add-Check ($modules.Contains('RestoreLatestConfigBackup') -and $modules.Contains('MessageBoxButtons.YesNo') -and $modules.Contains('SaveXmlSafely(backup,configPath,12)')) 'Configuration restore requires explicit user confirmation and validates the selected copy'
Add-Check ($modules.Contains('TryLoadXmlDocument(d.FileName') -and $modules.Contains('IsValidSettingsDocument(imported,out validationError)') -and $modules.Contains('SaveXmlSafely(imported,configPath,12)')) 'Imported settings are size-limited, securely parsed, schema-checked and atomically saved'
Add-Check ($modules.Contains('SaveXmlSafely(local,path,8)') -and $modules.Contains('SaveXmlSafely(doc,manifestPath,4)')) 'Computer profiles and locally generated update manifests use safe XML persistence too'
$quickPages = @('Hardware Intelligence PRO','Backup Recovery ULTIMATE','Migration Intelligence PRO','Driver Download Center','Service Report Designer','Naprawa Windows','Serwis klientów','Naprawa offline','Operation Recovery Center')
$quickOk = $true
foreach ($page in $quickPages) { if (-not $main.Contains('"'+$page+'"')) { $quickOk = $false } }
Add-Check $quickOk 'Dashboard quick actions link to all nine existing diagnostic, recovery, migration and service modules'
Add-Check ($cmd.Contains('call :run_ps_check "CHECK_FIX129_CONFIG_PERSISTENCE.ps1"') -and $cmd.Contains('CHECK_SOURCE_FIX129.log')) 'FIX129 configuration regression is active in the versioned source gate'
$required = @('CHECK_FIX129_CONFIG_PERSISTENCE.ps1','FIX129_RELEASE_NOTES.txt','FIX129_MODULE_MAP.txt')
Add-Check (($required | Where-Object { $validator.Contains($_) }).Count -eq 3) 'Full package validation requires the FIX129 regression test and both documents'
Add-Check (($required | Where-Object { $allow -contains $_ }).Count -eq 3) 'Explicit source synchronization allowlist contains all FIX129 artifacts'
Add-Check (($required | Where-Object { $manifest.Contains($_) }).Count -eq 1) 'PowerShell manifest includes the FIX129 regression test'
Add-Check (($required | Where-Object { $safeBlock.Contains($_) -and $currentBlock.Contains($_) }).Count -eq 3) 'Release-preservation fixture permits only FIX129 test and documentation paths as safe tooling'
Add-Check ($version -eq '1.0.0.71' -and $assembly.Contains('AssemblyVersion("1.0.0.71")') -and $assembly.Contains('AssemblyInformationalVersion("FIX071")')) 'Application metadata is consistently bumped to immutable release 1.0.0.71 / FIX071'
$failed = @($checks | Where-Object { -not $_.Passed })
foreach ($check in $checks) { if ($check.Passed) { Write-Host ('[PASS] ' + $check.Name) } else { Write-Host ('[FAIL] ' + $check.Name) } }
if ($failed.Count) { Write-Host ('[FAIL] FIX129 configuration persistence: ' + (($failed | ForEach-Object { $_.Name }) -join '; ')); exit 1 }
Write-Host ('[PASS] FIX129 configuration persistence checks: {0}/{0}' -f $checks.Count)
exit 0
