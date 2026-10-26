export class WardrobeError extends Error {
  code: string;
  status: number;
  constructor(code: string, status = 400) { super(code); this.code = code; this.status = status; }
}

export async function readBody(request: Request): Promise<Record<string, unknown>> {
  const reader = request.body?.getReader();
  if (!reader) throw new WardrobeError('INVALID_REQUEST');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 1_550_000) { await reader.cancel(); throw new WardrobeError('REQUEST_TOO_LARGE', 413); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try {
    const value = JSON.parse(new TextDecoder().decode(bytes));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch { throw new WardrobeError('INVALID_REQUEST'); }
}

export function uuid(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new WardrobeError('INVALID_ID');
  }
  return value.toLowerCase();
}

export function revision(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) throw new WardrobeError('INVALID_REVISION');
  return value as number;
}

// This is a structural guard, not a photo decoder. The client re-encodes pixels.
// Reject EXIF/XMP/IPTC/comments, oversized dimensions and trailing data so a
// direct API caller cannot bypass the declared upload byte/metadata contract.
export function jpeg(value: unknown, maxBytes: number): Uint8Array {
  if (typeof value !== 'string' || value.length > Math.ceil(maxBytes / 3) * 4 ||
    value.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) throw new WardrobeError('INVALID_PHOTO');
  let binary: string;
  try { binary = atob(value); } catch { throw new WardrobeError('INVALID_PHOTO'); }
  // Avoid the iterable Array intermediate for a 1 MB input on 256 MB Edge workers.
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  if (bytes.length > maxBytes || bytes.length < 12 || bytes[0] !== 255 || bytes[1] !== 216) throw new WardrobeError('INVALID_PHOTO');
  let offset = 2;
  let dimensions = false;
  let scan = false;
  let ended = false;
  while (offset < bytes.length) {
    if (bytes[offset++] !== 255) throw new WardrobeError('INVALID_PHOTO');
    while (bytes[offset] === 255) offset++;
    const marker = bytes[offset++];
    if (marker === 217) { ended = offset === bytes.length; break; }
    if (marker === 225 || marker === 237 || marker === 254) throw new WardrobeError('PHOTO_METADATA');
    if (marker === 0 || marker === 216 || marker === undefined || (marker >= 208 && marker <= 215)) throw new WardrobeError('INVALID_PHOTO');
    if (offset + 2 > bytes.length) throw new WardrobeError('INVALID_PHOTO');
    const length = (bytes[offset] << 8) | bytes[offset + 1];
    if (length < 2 || offset + length > bytes.length) throw new WardrobeError('INVALID_PHOTO');
    if ([192, 193, 194].includes(marker)) {
      if (length < 8) throw new WardrobeError('INVALID_PHOTO');
      const height = (bytes[offset + 3] << 8) | bytes[offset + 4];
      const width = (bytes[offset + 5] << 8) | bytes[offset + 6];
      if (width < 1 || height < 1 || width > 1600 || height > 1600) throw new WardrobeError('PHOTO_DIMENSIONS');
      dimensions = true;
    }
    offset += length;
    if (marker === 218) {
      scan = true;
      while (offset < bytes.length) {
        if (bytes[offset] !== 255) { offset++; continue; }
        const next = bytes[offset + 1];
        if (next === 0 || (next >= 208 && next <= 215)) { offset += 2; continue; }
        break;
      }
    }
  }
  if (!dimensions || !scan || !ended) throw new WardrobeError('INVALID_PHOTO');
  return bytes;
}

export async function fingerprint(main: Uint8Array, thumb: Uint8Array): Promise<string> {
  const bytes = new Uint8Array(8 + main.length + thumb.length);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, main.length);
  view.setUint32(4, thumb.length);
  bytes.set(main, 8); bytes.set(thumb, 8 + main.length);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (n) => n.toString(16).padStart(2, '0')).join('');
}

export function cors(request: Request, allowedOrigins: string): Record<string, string> {
  const origin = request.headers.get('origin');
  const headers: Record<string, string> = {
    'Vary': 'Origin', 'Cache-Control': 'no-store',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'X-Content-Type-Options': 'nosniff',
  };
  if (origin) {
    if (!allowedOrigins.split(',').map((s) => s.trim()).filter(Boolean).includes(origin)) throw new WardrobeError('ORIGIN_NOT_ALLOWED', 403);
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

export function safeError(error: unknown): { code: string; status: number } {
  if (error instanceof WardrobeError) return { code: error.code, status: error.status };
  return { code: 'INTERNAL', status: 500 };
}
