import { inflateSync } from 'node:zlib';
import { decode, encode } from 'npm:fast-png@8.0.0';
import encodeJpeg from 'npm:jpeg-js@0.4.4/lib/encoder.js';

const WIDTH = 1024;
const HEIGHT = 1536;
const MAX_BYTES = 8_000_000;
const THUMB_WIDTH = 120;
const THUMB_HEIGHT = 180;
const MAX_THUMB_BYTES = 100_000;
// Finite CPU/allocation budget. Reuse the 600px resize for the first two attempts.
const JPEG_CANDIDATES = [
  { width: 600, height: 900, quality: 82 },
  { width: 600, height: 900, quality: 65 },
  { width: 450, height: 675, quality: 65 },
] as const;
const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

type JpegEncoder = (image: { width: number; height: number; data: Uint8Array }, quality: number) => { data: Uint8Array };

/** Area resampling includes partial edge pixels, unlike nearest-neighbour or a floor-bin average. */
function resize(data: ArrayLike<number>, channels: number, width: number, height: number, opaque: boolean) {
  const pixels = new Uint8Array(width * height * 4);
  const xScale = WIDTH / width, yScale = HEIGHT / height;
  const area = xScale * yScale;
  for (let y = 0; y < height; y++) {
    const y0 = y * yScale, y1 = (y + 1) * yScale;
    for (let x = 0; x < width; x++) {
      const x0 = x * xScale, x1 = (x + 1) * xScale;
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = Math.floor(y0); sy < Math.min(HEIGHT, Math.ceil(y1)); sy++) {
        const wy = Math.min(y1, sy + 1) - Math.max(y0, sy);
        for (let sx = Math.floor(x0); sx < Math.min(WIDTH, Math.ceil(x1)); sx++) {
          const weight = wy * (Math.min(x1, sx + 1) - Math.max(x0, sx));
          const p = (sy * WIDTH + sx) * channels;
          const alpha = channels === 4 ? data[p + 3] : 255;
          // Filter premultiplied RGB in both modes so hidden transparent colors cannot
          // bleed into visible edges. JPEG additionally composites over white.
          const opacity = alpha / 255;
          const background = opaque ? 255 - alpha : 0;
          r += (data[p] * opacity + background) * weight;
          g += (data[p + 1] * opacity + background) * weight;
          b += (data[p + 2] * opacity + background) * weight;
          a += alpha * weight;
        }
      }
      const p = (y * width + x) * 4;
      const colorWeight = opaque ? area : a / 255;
      // PNG stores straight alpha: unpremultiply after filtering, or canonicalize RGB
      // to zero for an entirely transparent footprint (no division by zero).
      pixels[p] = colorWeight ? Math.round(r / colorWeight) : 0;
      pixels[p + 1] = colorWeight ? Math.round(g / colorWeight) : 0;
      pixels[p + 2] = colorWeight ? Math.round(b / colorWeight) : 0;
      pixels[p + 3] = opaque ? 255 : Math.round(a / area);
    }
  }
  return pixels;
}

// Exported factory is a deterministic failure seam for tests. The production export
// below always uses the pinned encoder; callers cannot select quality or dimensions.
export function createVisualizationPngDecoder(jpegEncoder: JpegEncoder = encodeJpeg) {
  return (bytes: Uint8Array) => decodePng(bytes, jpegEncoder);
}

export const decodeVisualizationPng = createVisualizationPngDecoder();

/** Narrow, bounded decoder for this trial's fixed RGB/RGBA8, non-interlaced PNG. */
function decodePng(bytes: Uint8Array, jpegEncoder: JpegEncoder) {
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
  let paletteSeen = false;
  let chunks = 0;
  for (let offset = 8; offset < bytes.length;) {
    if (++chunks > 4096 || offset + 12 > bytes.length) throw new Error('invalid_png_chunks');
    const length = view.getUint32(offset);
    const type = kind(offset + 4);
    const end = offset + 12 + length;
    if (end > bytes.length || (offset !== 8 && type === 'IHDR') ||
        ['acTL', 'fcTL', 'fdAT'].includes(type)) throw new Error('invalid_png_chunks');
    // fast-png materializes one array per palette entry. Bound this optional
    // truecolor palette before decode, rather than relying only on total PNG bytes.
    if (type === 'PLTE') {
      if (paletteSeen || compressed.length || length === 0 || length > 768 || length % 3 !== 0) {
        throw new Error('invalid_png_palette');
      }
      paletteSeen = true;
    }
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
  const decodeMs = performance.now() - started;
  let thumbnail: Uint8Array | undefined;
  let thumbnailWidth = THUMB_WIDTH, thumbnailHeight = THUMB_HEIGHT;
  let thumbnailMimeType: 'image/jpeg' | 'image/png' = 'image/png';
  let jpegAttempts = 0, resizeMs = 0, jpegEncodeMs = 0, fallbackMs = 0;
  let thumbnailQuality: number | null = null;
  let thumbnailFallbackReason: 'jpeg_error' | 'jpeg_byte_limit' | null = null;
  try {
    let previousWidth = 0, pixels = new Uint8Array();
    for (const candidate of JPEG_CANDIDATES) {
      if (previousWidth !== candidate.width) {
        const resizeStart = performance.now();
        pixels = resize(decoded.data, channels, candidate.width, candidate.height, true);
        resizeMs += performance.now() - resizeStart;
        previousWidth = candidate.width;
      }
      jpegAttempts++;
      const encodeStart = performance.now();
      let jpeg: Uint8Array;
      try {
        jpeg = jpegEncoder({ width: candidate.width, height: candidate.height, data: pixels }, candidate.quality).data;
      } finally { jpegEncodeMs += performance.now() - encodeStart; }
      // Header/end guard also catches malformed data returned by a failed encoder.
      if (jpeg.length < 4 || jpeg[0] !== 255 || jpeg[1] !== 216 || jpeg.at(-2) !== 255 || jpeg.at(-1) !== 217) {
        throw new Error('invalid_jpeg_thumbnail');
      }
      if (jpeg.length <= MAX_THUMB_BYTES) {
        thumbnail = jpeg;
        thumbnailWidth = candidate.width; thumbnailHeight = candidate.height;
        thumbnailMimeType = 'image/jpeg'; thumbnailQuality = candidate.quality;
        break;
      }
    }
    if (!thumbnail) thumbnailFallbackReason = 'jpeg_byte_limit';
  } catch {
    thumbnailFallbackReason = 'jpeg_error';
  }
  if (!thumbnail) {
    const fallbackStart = performance.now();
    const pixels = resize(decoded.data, channels, THUMB_WIDTH, THUMB_HEIGHT, false);
    thumbnail = encode({ width: THUMB_WIDTH, height: THUMB_HEIGHT, depth: 8, channels: 4, data: pixels });
    // Raw RGBA is only 86,400 bytes; even incompressible PNG stays under the bound.
    if (thumbnail.length > MAX_THUMB_BYTES) throw new Error('thumbnail_too_large');
    fallbackMs = performance.now() - fallbackStart;
  }
  return {
    main: bytes, thumbnail, width: WIDTH, height: HEIGHT,
    thumbnailMimeType, thumbnailWidth, thumbnailHeight,
    metrics: { elapsedMs: performance.now() - started, mainBytes: bytes.length,
      thumbnailBytes: thumbnail.length, decodedBytes: decoded.data.byteLength,
      boundedScanBytes: expected, decodeMs, resizeMs, jpegEncodeMs, fallbackMs,
      jpegAttempts, thumbnailQuality, thumbnailFallback: thumbnailMimeType === 'image/png',
      thumbnailFallbackReason, thumbnailMimeType, thumbnailWidth, thumbnailHeight },
  };
}
