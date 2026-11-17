import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
console.log('FIX77 legacy runner -> forwarding to corrected FIX78 test suite.');
const result=spawnSync(process.execPath,[path.join(ROOT,'scripts','run-tests-fix78.mjs')],{cwd:ROOT,stdio:'inherit',shell:false});
if(result.error){console.error(result.error.message);process.exitCode=1;}
else process.exitCode=result.status??1;
