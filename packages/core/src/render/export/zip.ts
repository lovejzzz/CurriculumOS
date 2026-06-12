/** render/export/zip.ts — a minimal, dependency-free ZIP writer (stored, no
 *  compression). Pure (bytes in → bytes out), no fs/effects, so it lives in
 *  core and runs in every home. One builder, no façade duplication (trap #7). */

export interface ZipEntry {
  path: string; // forward-slash path inside the archive
  data: Uint8Array;
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function strBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function u16(n: number): number[] {
  return [n & 0xff, (n >>> 8) & 0xff];
}
function u32(n: number): number[] {
  return [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
}

function concat(chunks: (number[] | Uint8Array)[]): Uint8Array {
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c instanceof Uint8Array ? c : Uint8Array.from(c), off);
    off += c.length;
  }
  return out;
}

/** Build a ZIP archive from entries. Uses a fixed DOS timestamp so the bytes
 *  are deterministic (replay-stable; no Date.now). Chunk-concatenated — never
 *  spreads large byte arrays (Office parts nest zips inside the package zip). */
export function buildZip(entries: ZipEntry[]): Uint8Array {
  const DOS_TIME = 0; // fixed for determinism
  const DOS_DATE = 0x21; // 1980-01-01
  const chunks: (number[] | Uint8Array)[] = [];
  const central: (number[] | Uint8Array)[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = strBytes(entry.path);
    const crc = crc32(entry.data);
    const size = entry.data.length;

    const localHeader = [
      ...u32(0x04034b50),
      ...u16(20), // version needed
      ...u16(0), // flags
      ...u16(0), // method 0 = stored
      ...u16(DOS_TIME),
      ...u16(DOS_DATE),
      ...u32(crc),
      ...u32(size),
      ...u32(size),
      ...u16(nameBytes.length),
      ...u16(0), // extra len
    ];
    chunks.push(localHeader, nameBytes, entry.data);

    const centralHeader = [
      ...u32(0x02014b50),
      ...u16(20),
      ...u16(20),
      ...u16(0),
      ...u16(0),
      ...u16(DOS_TIME),
      ...u16(DOS_DATE),
      ...u32(crc),
      ...u32(size),
      ...u32(size),
      ...u16(nameBytes.length),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u32(0),
      ...u32(offset),
    ];
    central.push(centralHeader, nameBytes);
    offset += localHeader.length + nameBytes.length + entry.data.length;
  }

  const centralBytes = concat(central);
  const end = [
    ...u32(0x06054b50),
    ...u16(0),
    ...u16(0),
    ...u16(entries.length),
    ...u16(entries.length),
    ...u32(centralBytes.length),
    ...u32(offset),
    ...u16(0),
  ];

  return concat([...chunks, centralBytes, end]);
}

export function textEntry(path: string, text: string): ZipEntry {
  return { path, data: strBytes(text) };
}

export function bytesEntry(path: string, data: Uint8Array): ZipEntry {
  return { path, data };
}

/** Read a STORED-method zip (the only kind this writer produces — and Office
 *  files we build ourselves). Walks local file headers; no inflate needed.
 *  The export audit uses this to reopen rendered bytes (trap #8). */
export function readZipStored(bytes: Uint8Array): ZipEntry[] {
  const entries: ZipEntry[] = [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let off = 0;
  while (off + 30 <= bytes.length) {
    const sig = view.getUint32(off, true);
    if (sig !== 0x04034b50) break; // central directory reached
    const method = view.getUint16(off + 8, true);
    const compSize = view.getUint32(off + 18, true);
    const nameLen = view.getUint16(off + 26, true);
    const extraLen = view.getUint16(off + 28, true);
    const name = new TextDecoder().decode(bytes.subarray(off + 30, off + 30 + nameLen));
    const dataStart = off + 30 + nameLen + extraLen;
    if (method !== 0) throw new Error(`readZipStored: entry "${name}" is compressed (method ${method}); only stored zips are readable here`);
    entries.push({ path: name, data: bytes.subarray(dataStart, dataStart + compSize) });
    off = dataStart + compSize;
  }
  return entries;
}
