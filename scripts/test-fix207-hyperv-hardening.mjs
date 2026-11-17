import fs from 'node:fs';
import assert from 'node:assert/strict';
const audit=fs.readFileSync('tools/FIX207_VERIFY_HYPERV_ISOLATION.ps1','utf8');
const triage=fs.readFileSync('tools/FIX207_STATIC_FILE_TRIAGE.ps1','utf8');
const start=fs.readFileSync('tools/FIX200_START_ISOLATED_HYPERV_VM.ps1','utf8');
const checks=[
['VM audit checks shutdown, no network, integration services, VHD, Secure Boot and checkpoint', ['VM_OFF','NO_NETWORK_ADAPTERS','NO_GUEST_INTEGRATION_SERVICES','EXISTING_VHD_PATHS','SECURE_BOOT','BASELINE_CHECKPOINT','NO_AUTOMATIC_START'].every(x=>audit.includes(x))],
['VM audit is read-only and leaves the VM off',audit.includes('Audyt konfiguracji zakończony. Maszyna nadal jest wyłączona.')&&!audit.includes('Start-VM')],
['start gate repeats isolation and checkpoint checks before Start-VM',start.includes('Get-VMNetworkAdapter')&&start.includes('Get-VMIntegrationService')&&start.includes('Get-VMFirmware')&&start.includes('Get-VMSnapshot')&&start.includes('Start-VM')],
['static triage calculates SHA-256 and signature metadata',triage.includes('Get-FileHash')&&triage.includes('Get-AuthenticodeSignature')&&triage.includes('Zone.Identifier')],
['static triage neither executes nor uploads the sample and avoids malware verdict',triage.includes('executionPerformed=$false')&&triage.includes('contentUploaded=$false')&&triage.includes('NO_AUTOMATIC_MALWARE_VERDICT')&&!triage.includes('Start-Process')],
['Windows launcher scripts exist',fs.existsSync('VERIFY_LABORATORIUM_FIX207.cmd')&&fs.existsSync('ANALIZA_PLIKU_FIX207.cmd')]
];
for(const [name,ok] of checks){console.log(`${ok?'[PASS]':'[FAIL]'} ${name}`);assert.ok(ok,name)}
console.log(`FIX207 HYPERV / STATIC TRIAGE CONTRACT: ${checks.length}/${checks.length} PASS (static inspection only; PowerShell not executed here)`);
