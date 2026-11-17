import fs from 'node:fs';import assert from 'node:assert/strict';
const sensors=fs.readFileSync('tools/FIX224_LIVE_SENSOR_MONITOR.ps1','utf8'),hyperv=fs.readFileSync('tools/FIX226_HYPERV_LAB_MANAGER.ps1','utf8');
for(const [label,ok] of [
 ['sensor monitor supports LHM/OHM',sensors.includes('LibreHardwareMonitor')&&sensors.includes('OpenHardwareMonitor')],
 ['missing WMI provider is explicit',sensors.includes('SENSOR_PROVIDER_NOT_FOUND')],
 ['sensor writes structured local sample output',sensors.includes('ConvertTo-Json')&&sensors.includes('.jsonl')],
 ['Hyper-V audit checks virtual network adapters',hyperv.includes('Get-VMNetworkAdapter')],
 ['Hyper-V audit checks integration services and Secure Boot',hyperv.includes('Get-VMIntegrationService')&&hyperv.includes('SecureBoot')],
 ['restoring a baseline asks for confirmation',hyperv.includes('ShouldProcess')&&hyperv.includes('RestoreBaseline')],
 ['mutating Hyper-V actions require administrator permissions',hyperv.includes('WindowsPrincipal')&&hyperv.includes('WindowsBuiltInRole]::Administrator')],
 ['no malware sample execution is implemented',!hyperv.includes('Start-Process')&&!hyperv.includes('Invoke-Expression')]
]){console.log(`${ok?'[PASS]':'[FAIL]'} ${label}`);assert.ok(ok,label)}
console.log('FIX224/FIX226 LOCAL TOOLS CONTRACT: 8/8 PASS (Windows execution still required)');
