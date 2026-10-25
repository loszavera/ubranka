import { inflateSync } from 'node:zlib';
import { decode, encode } from 'npm:fast-png@8.0.0';

const WIDTH = 1024;
const HEIGHT = 1536;
const MAX_BYTES = 8_000_000;
const THUMB_WIDTH = 120;
const THUMB_HEIGHT = 180;
const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

/** Narrow, bounded decoder for this trial's fixed RGB/RGBA8, non-interlaced PNG. */
export function decodeVisualizationPng(bytes: Uint8Array) {
  const started = performance.now();
  if (bytes.length < 45 || bytes.length > MAX_BYTES ||
      !SIGNATURE.every((b, i) => bytes[i] === b)) throw new Error('invalid_png');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const kind = (offset: number) => String.fromCharCode(...bytes.subarray(offset, offset + 4));
  if (view.getUint32(8) !== 13 || kind(12) !== 'IHDR' ||
      view.getUint32(16) !== WIDTH || view.getUint32(20) !== HEIGHT ||
      bytes[24] !== 8 || ![2, 6].includes(bytes[25]) ||
      bytes[26] !== 0 || bytes[27] !== 0 || bytes[28] !== 0) {
    throw new Error('unsupported_png_layout');
  }
  const channels = bytes[25] === 2 ? 3 : 4;
  const compressed: Uint8Array[] = [];
  let total = 0;
  let ended = false;
  let dataEnded = false;
  let chunks = 0;
  for (let offset = 8; offset < bytes.length;) {
    if (++chunks > 4096 || offset + 12 > bytes.length) throw new Error('invalid_png_chunks');
    const length = view.getUint32(offset);
    const type = kind(offset + 4);
    const end = offset + 12 + length;
    if (end > bytes.length || (offset !== 8 && type === 'IHDR') ||
        ['acTL', 'fcTL', 'fdAT'].includes(type)) throw new Error('invalid_png_chunks');
    if (type === 'IDAT') {
      if (dataEnded) throw new Error('invalid_png_chunks');
      compressed.push(bytes.subarray(offset + 8, end - 4));
      total += length;
    } else if (compressed.length) dataEnded = true;
    // Reject unknown critical chunks, and compressed metadata (unbounded secondary inflates).
    if ((!['IHDR', 'IDAT', 'IEND', 'PLTE'].includes(type) && type[0] === type[0].toUpperCase()) ||
        ['iCCP', 'zTXt', 'iTXt'].includes(type)) throw new Error('unsupported_png_chunk');
    if (type === 'IEND') {
      if (length !== 0 || end !== bytes.length || !compressed.length) throw new Error('invalid_png_end');
      ended = true;
    }
    offset = end;
  }
  if (!ended || total === 0) throw new Error('invalid_png_end');
  const joined = new Uint8Array(total);
  let cursor = 0;
  for (const part of compressed) { joined.set(part, cursor); cursor += part.length; }
  // The library's pure-JS inflate has no caller cap. Validate the exact stream with
  // native bounded zlib first, before allowing it to allocate its decode buffer.
  const expected = HEIGHT * (1 + WIDTH * channels);
  const bounded = inflateSync(joined, { maxOutputLength: expected });
  if (bounded.byteLength !== expected) throw new Error('invalid_png_scanlines');
  const decoded = decode(bytes, { checkCrc: true });
  if (decoded.width !== WIDTH || decoded.height !== HEIGHT || decoded.depth !== 8 ||
      decoded.channels !== channels || decoded.data.length !== WIDTH * HEIGHT * channels) {
    throw new Error('invalid_png_pixels');
  }
  const pixels = new Uint8Array(THUMB_WIDTH * THUMB_HEIGHT * 4);
  // Box average includes every source pixel and avoids aliasing on thin garment edges.
  for (let y = 0; y < THUMB_HEIGHT; y++) {
    const y0 = Math.floor(y * HEIGHT / THUMB_HEIGHT);
    const y1 = Math.floor((y + 1) * HEIGHT / THUMB_HEIGHT);
    for (let x = 0; x < THUMB_WIDTH; x++) {
      const x0 = Math.floor(x * WIDTH / THUMB_WIDTH);
      const x1 = Math.floor((x + 1) * WIDTH / THUMB_WIDTH);
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = y0; sy < y1; sy++) for (let sx = x0; sx < x1; sx++) {
        const p = (sy * WIDTH + sx) * channels;
        r += decoded.data[p]; g += decoded.data[p + 1]; b += decoded.data[p + 2];
        a += channels === 4 ? decoded.data[p + 3] : 255;
      }
      const count = (x1 - x0) * (y1 - y0);
      const p = (y * THUMB_WIDTH + x) * 4;
      pixels[p] = Math.round(r / count); pixels[p + 1] = Math.round(g / count);
      pixels[p + 2] = Math.round(b / count); pixels[p + 3] = Math.round(a / count);
    }
  }
  const thumbnail = encode({ width: THUMB_WIDTH, height: THUMB_HEIGHT, depth: 8, channels: 4, data: pixels });
  if (thumbnail.length > 100_000) throw new Error('thumbnail_too_large');
  return {
    main: bytes, thumbnail, width: WIDTH, height: HEIGHT,
    metrics: { elapsedMs: performance.now() - started, mainBytes: bytes.length,
      thumbnailBytes: thumbnail.length, decodedBytes: decoded.data.byteLength,
      boundedScanBytes: expected },
  };
}
