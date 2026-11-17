import fs from 'node:fs';
import assert from 'node:assert/strict';
const ps=fs.readFileSync('tools/FIX198_WINDOWS_HARDWARE_COLLECTOR.ps1','utf8');
const cmd=fs.readFileSync('WYKONAJ_DIAGNOSTYKE_SPRZETU_FIX198.cmd','utf8');
const importer=fs.readFileSync('WEB_PUBLISH/assets/academy-hardware-import-fix198.js','utf8');
const html=fs.readFileSync('WEB_PUBLISH/index.html','utf8');
const sw=fs.readFileSync('WEB_PUBLISH/service-worker.js','utf8');
const checks=[
['uses actual Windows CIM hardware data',/Get-CimInstance/.test(ps)&&['Win32_Processor','Win32_PhysicalMemory','Win32_VideoController','Win32_DiskDrive','Win32_BaseBoard','Win32_BIOS'].every(x=>ps.includes(x))],
['collects physical disk reliability/health when supported',ps.includes('Get-PhysicalDisk')&&ps.includes('Get-StorageReliabilityCounter')&&ps.includes('HealthStatus')],
['collects battery, ACPI thermal zones and selected driver versions',ps.includes('Win32_Battery')&&ps.includes('MSAcpi_ThermalZoneTemperature')&&ps.includes('Win32_PnPSignedDriver')],
['collects relevant Windows diagnostic events',ps.includes('Get-WinEvent')&&/WHEA\|Disk\|StorPort/.test(ps)],
['writes structured JSON and human-readable summary',ps.includes('NAUKA_FIX198_SPRZET.json')&&ps.includes('NAUKA_FIX198_PODSUMOWANIE.txt')&&ps.includes('ConvertTo-Json')],
['avoids serial numbers, user names and MAC addresses in report',ps.includes('serialNumbersIncluded=$false')&&ps.includes('userNamesIncluded=$false')&&ps.includes('networkMacAddressesIncluded=$false')&&ps.includes('systemEventsMayContainLocalPathsOrAccountNames=$true')&&!/SerialNumber\s*=|MACAddress\s*=|UserName\s*=/.test(ps)],
['contains explicit sensor and WMI VRAM limitations',ps.includes('ACPI nie jest wiarygodnym zamiennikiem')&&ps.includes('Dostępność SMART/temperatur')&&ps.includes('AdapterRAM_WMI_GB')&&ps.includes('VRAM jest wartością orientacyjną')&&importer.includes('VRAM WMI — orientacyjnie GB')&&importer.includes('data.networkAdapters')&&importer.includes('Windows, płyta główna i BIOS')&&importer.includes('OperationalStatus??')],
['read-only collector does not run repair/flash/disk-write commands',!/(Repair-Volume|Clear-Disk|Format-Volume|Set-Partition|Initialize-Disk|Update-BIOS|Flash|Remove-Item|Start-Process)/i.test(ps)],
['one-click Windows launcher points to the real collector',cmd.includes('tools\\FIX198_WINDOWS_HARDWARE_COLLECTOR.ps1')&&cmd.includes('powershell.exe -NoProfile')],
['hardware JSON is rendered locally inside the existing service lab',importer.includes('NAUKA_OD_A_DO_Z_HARDWARE_SNAPSHOT')&&importer.includes('Niczego nie wysłano na serwer')&&html.includes('id=\"a198HardwareFile\"')&&html.includes('academy-hardware-import-fix198.js')&&sw.includes('academy-hardware-import-fix198.js')&&sw.includes('academy-hardware-import-fix198.css')]
];
for(const [name,ok] of checks){console.log(`${ok?'[PASS]':'[FAIL]'} ${name}`);assert.ok(ok,name)}
console.log(`FIX198 HARDWARE COLLECTOR CONTRACT: ${checks.length}/${checks.length} PASS`);
