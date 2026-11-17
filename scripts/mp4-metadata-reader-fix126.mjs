// FIX127 — dependency-free MP4 ISO-BMFF metadata reader.
// Reads common iTunes/QuickTime item-list text tags without ffprobe/FFmpeg.
'use strict';

const CONTAINERS = new Set(['moov', 'udta', 'meta', 'ilst']);

function readBox(buffer, offset, parentEnd) {
  if (offset + 8 > parentEnd) return null;
  const size32 = buffer.readUInt32BE(offset);
  const type = buffer.toString('latin1', offset + 4, offset + 8);
  let headerSize = 8;
  let size;
  if (size32 === 1) {
    if (offset + 16 > parentEnd) throw new Error(`Malformed extended MP4 box header at ${offset}`);
    const large = buffer.readBigUInt64BE(offset + 8);
    if (large > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error(`MP4 box too large at ${offset}`);
    size = Number(large);
    headerSize = 16;
  } else if (size32 === 0) {
    size = parentEnd - offset;
  } else {
    size = size32;
  }
  if (size < headerSize || offset + size > parentEnd) {
    throw new Error(`Invalid MP4 box ${JSON.stringify(type)} at ${offset} (size ${size})`);
  }
  return { type, offset, size, headerSize, payloadStart: offset + headerSize, end: offset + size };
}

export function readMp4MetadataTag(input, wantedTag = '©nam') {
  if (!Buffer.isBuffer(input) && !(input instanceof Uint8Array)) {
    throw new TypeError('MP4 input must be a Buffer or Uint8Array');
  }
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
  if (buffer.length < 16) throw new Error('MP4 file is too small to contain metadata');

  function scan(start, end, depth = 0) {
    if (depth > 12) throw new Error('MP4 metadata nesting limit exceeded');
    let offset = start;
    while (offset + 8 <= end) {
      const box = readBox(buffer, offset, end);
      if (!box) break;
      if (box.type === wantedTag) {
        let childOffset = box.payloadStart;
        while (childOffset + 8 <= box.end) {
          const child = readBox(buffer, childOffset, box.end);
          if (!child) break;
          if (child.type === 'data') {
            // data: 4-byte full-box type/flags, 4-byte locale, then UTF-8 text.
            if (child.size < child.headerSize + 8) throw new Error(`MP4 ${wantedTag} data atom is truncated`);
            return buffer.subarray(child.payloadStart + 8, child.end).toString('utf8').replace(/\0+$/g, '').trim();
          }
          childOffset = child.end;
        }
        return null;
      }
      if (CONTAINERS.has(box.type)) {
        const childStart = box.payloadStart + (box.type === 'meta' ? 4 : 0); // meta is a FullBox.
        const found = scan(childStart, box.end, depth + 1);
        if (found !== null) return found;
      }
      offset = box.end;
    }
    return null;
  }
  return scan(0, buffer.length);
}
