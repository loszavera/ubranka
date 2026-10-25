import { strict as assert } from 'node:assert';
import { encode, decode } from 'npm:fast-png@8.0.0';
import { deflateSync } from 'node:zlib';
import { decodeVisualizationPng } from '../functions/_shared/png-codec.ts';

const W = 1024, H = 1536;
function crc(bytes: Uint8Array) {
  let c = 0xffffffff;
  for (const b of bytes) { c ^= b; for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); }
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Uint8Array) {
  const out = new Uint8Array(data.length + 12), v = new DataView(out.buffer);
  v.setUint32(0, data.length); out.set(new TextEncoder().encode(type), 4); out.set(data, 8);
  v.setUint32(out.length - 4, crc(out.subarray(4, out.length - 4))); return out;
}
function concat(...parts: Uint8Array[]) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let pos = 0; for (const p of parts) { out.set(p, pos); pos += p.length; } return out;
}
function source(noise = false) {
  const pixels = new Uint8Array(W * H * 4); let seed = 19;
  for (let i = 0; i < pixels.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    pixels[i] = noise ? seed >>> 24 : i % 4 === 3 ? 255 : 127;
  }
  return encode({ width: W, height: H, channels: 4, depth: 8, data: pixels });
}

Deno.test('fixed-size real pixels, bounded thumbnail and identity main; noise stress', () => {
  for (const noise of [false, true]) {
    const png = source(noise), start = Deno.memoryUsage();
    const result = decodeVisualizationPng(png);
    assert.equal(result.main, png); assert.ok(result.thumbnail.length <= 100_000);
    const thumb = decode(result.thumbnail, { checkCrc: true });
    assert.equal(thumb.width, 120); assert.equal(thumb.height, 180);
    console.log(JSON.stringify({ noise, ...result.metrics, memoryBefore: start, memoryAfter: Deno.memoryUsage() }));
  }
});

Deno.test('reject bad header, CRC, dimensions, truncation and trailing bytes', () => {
  const png = source();
  const badCrc = png.slice(); badCrc[29] ^= 1;
  const bigHeader = png.slice(); new DataView(bigHeader.buffer).setUint32(16, 65535);
  for (const bad of [new Uint8Array(), new Uint8Array(8_000_001),
    png.slice(1), png.slice(0, -1), concat(png, new Uint8Array([0])), badCrc, bigHeader]) {
    assert.throws(() => decodeVisualizationPng(bad));
  }
});

Deno.test('reject overlong inflate stream, compressed metadata and APNG before decode', () => {
  const png = source(), header = png.subarray(0, 33), end = chunk('IEND', new Uint8Array());
  const bomb = concat(header, chunk('IDAT', deflateSync(new Uint8Array(H * (1 + W * 4) + 1))), end);
  assert.throws(() => decodeVisualizationPng(bomb));
  for (const type of ['acTL', 'iCCP', 'iTXt', 'zTXt']) {
    assert.throws(() => decodeVisualizationPng(concat(header, chunk(type, new Uint8Array(8)), png.subarray(33))));
  }
});

if (import.meta.main) {
  const path = Deno.args[0];
  if (!path) throw new Error('Pass a saved synthetic PNG for offline measurement');
  const result = decodeVisualizationPng(await Deno.readFile(path));
  console.log(JSON.stringify({ ...result.metrics, memoryAfter: Deno.memoryUsage() }));
}
