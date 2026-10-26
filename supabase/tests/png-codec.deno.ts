import { strict as assert } from 'node:assert';
import { encode, decode } from 'npm:fast-png@8.0.0';
import { deflateSync } from 'node:zlib';
import jpeg from 'npm:jpeg-js@0.4.4';
import { createVisualizationPngDecoder, decodeVisualizationPng } from '../functions/_shared/png-codec.ts';

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
    const thumb = result.thumbnailMimeType === 'image/jpeg'
      ? jpeg.decode(result.thumbnail, { useTArray: true, maxResolutionInMP: 1, maxMemoryUsageInMB: 32 })
      : decode(result.thumbnail, { checkCrc: true });
    assert.equal(thumb.width, result.thumbnailWidth); assert.equal(thumb.height, result.thumbnailHeight);
    assert.ok(result.metrics.jpegAttempts <= 3);
    if (!noise) {
      assert.equal(result.thumbnailMimeType, 'image/jpeg');
      assert.equal(thumb.width, 600); assert.equal(thumb.height, 900);
      assert.equal(result.metrics.thumbnailFallback, false);
    }
    console.log(JSON.stringify({ noise, ...result.metrics, memoryBefore: start, memoryAfter: Deno.memoryUsage() }));
  }
});

Deno.test('RGB accepted and transparent RGBA composites over white without hidden RGB leaking', () => {
  for (const channels of [3, 4] as const) {
    const pixels = new Uint8Array(W * H * channels);
    for (let p = 0; p < pixels.length; p += channels) pixels[p] = 255; // RGB red, RGBA transparent red
    const png = encode({ width: W, height: H, channels, depth: 8, data: pixels });
    const result = decodeVisualizationPng(png);
    assert.equal(result.main, png);
    const thumb = jpeg.decode(result.thumbnail, { useTArray: true, maxResolutionInMP: 1, maxMemoryUsageInMB: 32 });
    const expected = channels === 3 ? [255, 0, 0] : [255, 255, 255];
    for (let c = 0; c < 3; c++) assert.ok(Math.abs(thumb.data[c] - expected[c]) <= 2);
    assert.equal(thumb.data[3], 255);
    // The encoder receives only pixels, no EXIF/ICC/XMP or source metadata.
    const header = new TextDecoder('latin1').decode(result.thumbnail);
    for (const marker of ['Exif', 'ICC_PROFILE', 'http://ns.adobe.com/xap']) assert.ok(!header.includes(marker));
  }
});

Deno.test('encoder failure or repeated oversize produces bounded PNG without rejecting the valid main', () => {
  const png = source(true);
  for (const mode of ['throw', 'oversize', 'invalid'] as const) {
    let calls = 0;
    const decodeWithFailure = createVisualizationPngDecoder(() => {
      calls++;
      if (mode === 'throw') throw new Error('synthetic encoder failure');
      const data = new Uint8Array(mode === 'oversize' ? 100_001 : 4);
      if (mode === 'oversize') { data.set([255, 216]); data.set([255, 217], data.length - 2); }
      return { data };
    });
    const result = decodeWithFailure(png);
    assert.equal(result.main, png);
    assert.equal(calls, mode === 'oversize' ? 3 : 1);
    assert.equal(result.thumbnailMimeType, 'image/png');
    assert.equal(result.metrics.thumbnailFallback, true);
    assert.equal(result.metrics.thumbnailFallbackReason, mode === 'oversize' ? 'jpeg_byte_limit' : 'jpeg_error');
    assert.ok(result.thumbnail.length <= 100_000);
    const thumb = decode(result.thumbnail, { checkCrc: true });
    assert.equal(thumb.width, 120); assert.equal(thumb.height, 180);
  }
});

Deno.test('quality and resolution adaptation is bounded and reports the actual selected dimensions', () => {
  const seen: number[][] = [];
  const realEncode = jpeg.encode;
  const decodeAdaptive = createVisualizationPngDecoder((input, quality) => {
    seen.push([input.width, input.height, quality]);
    if (seen.length < 3) {
      const data = new Uint8Array(100_001);
      data.set([255, 216]); data.set([255, 217], data.length - 2);
      return { data };
    }
    return realEncode(input, quality);
  });
  const result = decodeAdaptive(source());
  assert.equal(seen.length, 3);
  assert.equal(result.thumbnailWidth, 450); assert.equal(result.thumbnailHeight, 675);
  assert.equal(result.thumbnailMimeType, 'image/jpeg');
  assert.equal(result.metrics.thumbnailQuality, seen[2][2]);
  assert.equal(result.metrics.thumbnailFallback, false);
  const thumb = jpeg.decode(result.thumbnail, { useTArray: true, maxResolutionInMP: 1, maxMemoryUsageInMB: 32 });
  assert.equal(thumb.width, result.thumbnailWidth); assert.equal(thumb.height, result.thumbnailHeight);
});

Deno.test('PNG fallback filters premultiplied alpha without hidden-color fringes', () => {
  const pixels = new Uint8Array(W * H * 4);
  for (let p = 0; p < pixels.length; p += 4) {
    // Alternating opaque black and fully transparent red within every output pixel.
    const transparent = (p / 4) % 2 === 1;
    pixels[p] = transparent ? 255 : 0;
    pixels[p + 3] = transparent ? 0 : 255;
  }
  const png = encode({ width: W, height: H, channels: 4, depth: 8, data: pixels });
  const fallback = createVisualizationPngDecoder(() => { throw new Error('synthetic failure'); });
  const result = fallback(png), thumb = decode(result.thumbnail, { checkCrc: true });
  assert.equal(result.main, png);
  assert.equal(result.thumbnailMimeType, 'image/png');
  for (let p = 0; p < thumb.data.length; p += 4) {
    assert.deepEqual(Array.from(thumb.data.subarray(p, p + 3)), [0, 0, 0]);
    assert.ok(thumb.data[p + 3] >= 110 && thumb.data[p + 3] <= 145);
  }
  // A fully transparent image has canonical zero RGB, not arbitrary hidden color.
  for (let p = 3; p < pixels.length; p += 4) pixels[p] = 0;
  const transparent = fallback(encode({ width: W, height: H, channels: 4, depth: 8, data: pixels }));
  assert.ok(decode(transparent.thumbnail).data.every(value => value === 0));
});

Deno.test('PLTE is bounded before library allocations, unique, and before image data', () => {
  const png = source(), header = png.subarray(0, 33), rest = png.subarray(33);
  for (const length of [0, 1, 2, 4, 769, 771, 3_000_000]) {
    const bad = concat(header, chunk('PLTE', new Uint8Array(length)), rest);
    assert.throws(() => decodeVisualizationPng(bad), /invalid_png_palette/);
  }
  const palette = chunk('PLTE', new Uint8Array(3));
  assert.throws(() => decodeVisualizationPng(concat(header, palette, palette, rest)), /invalid_png_palette/);
  assert.throws(() => decodeVisualizationPng(concat(png.subarray(0, -12), palette, png.subarray(-12))), /invalid_png_palette/);
  // A legal suggested palette for truecolor is preserved; no unrelated compatibility gate.
  for (const length of [3, 768]) {
    const valid = concat(header, chunk('PLTE', new Uint8Array(length)), rest);
    assert.equal(decodeVisualizationPng(valid).main, valid);
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
