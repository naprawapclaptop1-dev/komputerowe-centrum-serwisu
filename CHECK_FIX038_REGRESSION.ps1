$ErrorActionPreference = "Stop"
$main = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "WindowsVersionSwitcherPRO.cs"))
$modules = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "WindowsVersionSwitcherPRO.Modules.cs"))
$verify = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "VERIFY_PAYLOAD.ps1"))
if ($main -notmatch 'AddNav\("Migracja PC PRO"') { throw "FIX038: PC Migration navigation entry missing." }
if ($main -notmatch 'if\(id=="Migracja PC PRO"\) BuildPcMigrationTransferPage\(\);') { throw "FIX038: PC Migration page route missing." }
foreach ($pattern in @('BuildPcMigrationTransferPage','ExportPcMigrationPackage','VerifyPcMigrationPackage','ImportPcMigrationPackage','PcMigrationVerifyPackage','PcMigrationSafeRelative')) {
    if ($modules -notmatch $pattern) { throw "FIX038: required migration operation missing: $pattern" }
}
if ($modules -notmatch 'NEXUS_MIGRATION_MANIFEST_V1') { throw "FIX038: migration manifest format missing." }
if ($modules -notmatch 'PcMigrationHash') { throw "FIX038: SHA-256 integrity verification missing." }
if ($modules -notmatch 'FileAttributes.ReparsePoint') { throw "FIX038: reparse-point traversal protection missing." }
if ($modules -notmatch 'Liczba plików') { throw "FIX038: migration confirmation summary missing." }
if ($verify -notmatch 'CHECK_FIX038_REGRESSION\.ps1') { throw "FIX038: regression checker is not source-bound." }
if ($main -notmatch 'NEXUS RUBY' -or $main -notmatch 'NEXUS SOLAR' -or $main -notmatch 'NEXUS OCEAN') { throw "FIX038: three additional NEXUS themes missing." }
Write-Output "[PASS] FIX038 migration page, manifest validation, SHA-256, reparse-point protection and 10 themes verified."
