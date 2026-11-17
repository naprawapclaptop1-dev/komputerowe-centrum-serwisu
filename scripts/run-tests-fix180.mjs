#!/usr/bin/env node
'use strict';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const root=process.cwd();
const tasks=[
  ['Regresja pełnej istniejącej Akademii i FIX176–FIX179','scripts/run-tests-fix179.mjs'],
  ['Nowe kursy i audyt braku duplikatów FIX180','scripts/test-fix180-system-diagnostics.mjs']
];
let failed=false;
for(const [label,file] of tasks){console.log(`\n===== ${label} =====`);const result=spawnSync(process.execPath,[path.join(root,file)],{cwd:root,stdio:'inherit'});if(result.error||result.status!==0)failed=true;}
if(failed)process.exit(1);
console.log('\nNAUKA OD A DO Z FIX180 FULL REGRESSION: PASS');
