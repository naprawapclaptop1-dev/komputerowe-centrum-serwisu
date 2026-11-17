#!/usr/bin/env node
'use strict';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readMp4MetadataTag } from './mp4-metadata-reader-fix126.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function atom(type,payload,extended=false){
  const body=Buffer.isBuffer(payload)?payload:Buffer.from(payload);
  if(extended){const head=Buffer.alloc(16);head.writeUInt32BE(1,0);head.write(type,4,8,'latin1');head.writeBigUInt64BE(BigInt(16+body.length),8);return Buffer.concat([head,body]);}
  const head=Buffer.alloc(8);head.writeUInt32BE(8+body.length,0);head.write(type,4,8,'latin1');return Buffer.concat([head,body]);
}
const title='NAUKA OD A DO Z — DLA WSZYSTKICH';
const data=atom('data',Buffer.concat([Buffer.from([0,0,0,1,0,0,0,0]),Buffer.from(title,'utf8')]));
const name=atom('©nam',data);
const ilst=atom('ilst',name,true);
const meta=atom('meta',Buffer.concat([Buffer.alloc(4),ilst]));
const udta=atom('udta',meta);
const moov=atom('moov',udta,true);
const ftyp=atom('ftyp',Buffer.from([0x69,0x73,0x6f,0x6d,0,0,2,0,0x69,0x73,0x6f,0x6d,0x69,0x73,0x6f,0x32]));
const synthetic=Buffer.concat([ftyp,moov,atom('mdat',Buffer.from([1,2,3]))]);
const real=fs.readFileSync(path.join(ROOT,'WEB_PUBLISH/media/videos/akademia-dlaczego-warto-wspierac.mp4'));
const results=[];
function check(name,fn){fn();results.push(name);console.log(`[PASS] ${name}`);}
check('czyta tytuł projektu z rzeczywistego MP4 bez zewnętrznego ffprobe',()=>assert.equal(readMp4MetadataTag(real,'©nam'),title));
check('czyta UTF-8 z zagnieżdżonych atomów MP4 i obsługuje nagłówki 64-bitowe',()=>assert.equal(readMp4MetadataTag(synthetic,'©nam'),title));
check('zwraca null dla poprawnego MP4 bez żądanego znacznika',()=>assert.equal(readMp4MetadataTag(Buffer.concat([ftyp,atom('moov',atom('trak',Buffer.alloc(0)))]),'©nam'),null));
check('odrzuca niepoprawnie sformatowane atomy bez nieskończonej pętli',()=>assert.throws(()=>readMp4MetadataTag(Buffer.from([0,0,0,4,0x6d,0x6f,0x6f,0x76,0,0,0,0,0,0,0,0]),'©nam'),/Invalid MP4 box/));
console.log(`FIX127 MP4 NATIVE METADATA READER: ${results.length}/${results.length} PASS`);
