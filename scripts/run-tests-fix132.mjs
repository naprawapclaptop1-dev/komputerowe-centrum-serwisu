#!/usr/bin/env node
'use strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const result=spawnSync(process.execPath,[path.join(root,'scripts','run-tests-fix133.mjs')],{cwd:root,stdio:'inherit',windowsHide:true});
process.exitCode=result.status ?? 1;
