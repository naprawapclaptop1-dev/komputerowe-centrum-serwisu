import fs from 'node:fs';
import assert from 'node:assert/strict';
const create=fs.readFileSync('tools/FIX200_CREATE_ISOLATED_HYPERV_VM.ps1','utf8');
const start=fs.readFileSync('tools/FIX200_START_ISOLATED_HYPERV_VM.ps1','utf8');
const remove=fs.readFileSync('tools/FIX200_REMOVE_ISOLATED_HYPERV_VM.ps1','utf8');
const checks=[
['requires Windows Hyper-V cmdlets and administrator permissions',create.includes('Get-Command New-VM')&&create.includes('Test-Admin')],
['creates a generation-2 VM with local VHDX and no network switch',create.includes('New-VM -Name $Name -Generation 2')&&create.includes('New-VHD')&&!/New-VM[^\n]*-SwitchName/.test(create)],
['removes every virtual network adapter and verifies zero adapters',create.includes('Remove-VMNetworkAdapter')&&create.includes('$networkCount -ne 0')],
['disables guest integration services and automatic start',create.includes('Disable-VMIntegrationService')&&create.includes('AutomaticStartAction Nothing')],
['creates a clean baseline checkpoint and leaves VM powered off',create.includes('Checkpoint-VM')&&create.includes('-CheckpointType Standard')&&create.includes('Maszyna NIE została uruchomiona')],
['start script fails closed if a network adapter or unsafe service exists',start.includes('$adapters.Count -gt 0')&&start.includes('Where-Object { $_.Enabled }')&&start.includes('Wyłącz wszystkie przed startem')&&start.includes('Checkpoint-VM')],
['remove script keeps VHDX unless explicit DeleteFiles switch is used',remove.includes('[switch]$DeleteFiles')&&remove.includes('Pliki VHDX pozostawiono')],
['launcher uses the Hyper-V preparation script',fs.readFileSync('UTWORZ_LABORATORIUM_HYPERV_FIX200.cmd','utf8').includes('FIX200_CREATE_ISOLATED_HYPERV_VM.ps1')]
];
for(const [name,ok] of checks){console.log(`${ok?'[PASS]':'[FAIL]'} ${name}`);assert.ok(ok,name)}
console.log(`FIX200 HYPER-V ISOLATION CONTRACT: ${checks.length}/${checks.length} PASS`);
