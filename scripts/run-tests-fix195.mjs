import { spawnSync } from 'node:child_process';
import process from 'node:process';
const r=spawnSync(process.execPath,['scripts/test-fix195-interactive-labs.mjs'],{stdio:'inherit'});
process.exit(r.status ?? 1);
