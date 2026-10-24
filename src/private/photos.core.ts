import { PhotoError } from './photos.types.ts';

export const PHOTO_LIMITS = {
  inputBytes: 25_000_000,
  inputPixels: 48_000_000,
  mainBytes: 1_000_000,
  thumbnailBytes: 100_000,
  mainEdge: 1600,
  thumbnailEdge: 320,
} as const;

export function assertNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new PhotoError('aborted');
}

export function boundedDimensions(width: number, height: number, edge: number) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    throw new PhotoError('decode_failed');
  }
  if (width * height > PHOTO_LIMITS.inputPixels) throw new PhotoError('too_large');
  const scale = Math.min(1, edge / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

const ascii = (data: Uint8Array, start: number, end: number) =>
  String.fromCharCode(...data.slice(start, end));
const be16 = (data: Uint8Array, offset: number) => data[offset] * 256 + data[offset + 1];
const be32 = (data: Uint8Array, offset: number) => new DataView(data.buffer, data.byteOffset, data.byteLength).getUint32(offset);
const le24 = (data: Uint8Array, offset: number) => data[offset] + data[offset + 1] * 256 + data[offset + 2] * 65536;

/** Inspect encoded dimensions before asking a decoder to allocate the full raster. */
export function inspectPhoto(data: Uint8Array, mime = '', name = '') {
  if (/hei[cf]/i.test(mime) || /\.hei[cf]$/i.test(name) ||
      (ascii(data, 4, 8) === 'ftyp' && /hei[csx]|hev[csx]|mif1|msf1/.test(ascii(data, 8, 32)))) {
    throw new PhotoError('unsupported_heic');
  }
  if (!data.byteLength || data.byteLength > PHOTO_LIMITS.inputBytes) throw new PhotoError('too_large');
  let width = 0;
  let height = 0;
  let format: 'jpeg' | 'png' | 'webp';
  if (data[0] === 0xff && data[1] === 0xd8) {
    format = 'jpeg';
    let offset = 2;
    while (offset + 4 <= data.length) {
      if (data[offset] !== 0xff) throw new PhotoError('decode_failed');
      while (data[offset] === 0xff) offset++;
      const marker = data[offset++];
      if (marker === 0xda || marker === 0xd9) break;
      const length = be16(data, offset);
      if (length < 2 || offset + length > data.length) throw new PhotoError('decode_failed');
      if ([0xc0, 0xc1, 0xc2].includes(marker) && length >= 8) {
        height = be16(data, offset + 3);
        width = be16(data, offset + 5);
        break;
      }
      offset += length;
    }
  } else if (data.length >= 24 && data[0] === 137 && ascii(data, 1, 4) === 'PNG' && ascii(data, 12, 16) === 'IHDR') {
    format = 'png';
    width = be32(data, 16);
    height = be32(data, 20);
  } else if (data.length >= 30 && ascii(data, 0, 4) === 'RIFF' && ascii(data, 8, 12) === 'WEBP') {
    format = 'webp';
    const kind = ascii(data, 12, 16);
    if (kind === 'VP8X') {
      width = le24(data, 24) + 1;
      height = le24(data, 27) + 1;
    } else if (kind === 'VP8 ' && data[23] === 0x9d && data[24] === 0x01 && data[25] === 0x2a) {
      width = (data[26] + data[27] * 256) & 0x3fff;
      height = (data[28] + data[29] * 256) & 0x3fff;
    } else if (kind === 'VP8L' && data[20] === 0x2f) {
      width = 1 + (data[21] | ((data[22] & 0x3f) << 8));
      height = 1 + ((data[22] >> 6) | (data[23] << 2) | ((data[24] & 0x0f) << 10));
    }
  } else throw new PhotoError('unsupported_format');
  boundedDimensions(width, height, PHOTO_LIMITS.mainEdge);
  return { width, height, format };
}

/** Remove all optional APP/COM segments, including EXIF, GPS, XMP and trailing data.
 * Only use after raster re-encoding: removing original EXIF before decode would lose orientation.
 */
export function stripJpegMetadata(data: Uint8Array): Uint8Array {
  if (data[0] !== 0xff || data[1] !== 0xd8) throw new PhotoError('decode_failed');
  const chunks: Uint8Array[] = [data.slice(0, 2)];
  let offset = 2;
  while (offset < data.length) {
    const start = offset;
    if (data[offset++] !== 0xff) throw new PhotoError('decode_failed');
    while (data[offset] === 0xff) offset++;
    const marker = data[offset++];
    if (marker === 0xd9) {
      chunks.push(new Uint8Array([0xff, 0xd9]));
      const result = new Uint8Array(chunks.reduce((sum, part) => sum + part.length, 0));
      let position = 0;
      for (const part of chunks) { result.set(part, position); position += part.length; }
      return result;
    }
    if (offset + 2 > data.length) throw new PhotoError('decode_failed');
    const length = be16(data, offset);
    if (length < 2 || offset + length > data.length) throw new PhotoError('decode_failed');
    const end = offset + length;
    if (!((marker >= 0xe0 && marker <= 0xef) || marker === 0xfe)) chunks.push(data.slice(start, end));
    offset = end;
    if (marker === 0xda) {
      const scanStart = offset;
      while (offset < data.length - 1) {
        if (data[offset] === 0xff) {
          const next = data[offset + 1];
          if (next === 0 || (next >= 0xd0 && next <= 0xd7)) { offset += 2; continue; }
          break;
        }
        offset++;
      }
      chunks.push(data.slice(scanStart, offset));
    }
  }
  throw new PhotoError('decode_failed');
}
