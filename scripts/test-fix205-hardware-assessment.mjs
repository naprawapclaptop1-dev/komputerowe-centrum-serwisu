import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('WEB_PUBLISH/assets/academy-hardware-import-fix198.js','utf8');
const context=vm.createContext({document:{getElementById:()=>null},console});
vm.runInContext(source,context);
const assess=context.NaukaFix205AssessHardware;
assert.equal(typeof assess,'function','assessment function exported for test');
const result=assess({physicalDiskHealth:[{FriendlyName:'SSD test',HealthStatus:'Warning'}],systemEvents:[{Provider:'Microsoft-Windows-WHEA-Logger',Level:'Error',Id:17,Message:'PCIe error'}],limitations:['Test limitation']});
const empty=assess({physicalDiskHealth:[],systemEvents:[],limitations:[]});
const checks=[
['non-healthy disk produces a critical observation',result.critical===1&&result.findings.some(x=>x.detail.includes('SSD'))],
['WHEA hardware error produces a warning or critical observation',result.findings.some(x=>x.title.includes('WHEA'))],
['limitations from imported report are retained',result.limitations.length===1],
['missing telemetry is reported as unknown, not healthy',empty.findings.some(x=>x.title.includes('Brak potwierdzonego stanu SMART'))],
['assessment does not claim a certified health score or malware verdict',source.includes('nie certyfikowany wynik zdrowia')&&source.includes('Brak alertów nie potwierdza sprawności')]
];
for(const [name,ok] of checks){console.log(`${ok?'[PASS]':'[FAIL]'} ${name}`);assert.ok(ok,name)}
console.log(`FIX205 HARDWARE ASSESSMENT: ${checks.length}/${checks.length} PASS`);
