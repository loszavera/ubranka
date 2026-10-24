import { uuid, WardrobeError } from './protocol.ts';
import type { SupabaseRest } from './rest.ts';

type ReadablePhoto = { main_path: string; thumb_path: string; bytes: number; thumb_bytes: number; mime_type: string };

export async function privatePhotoResponse(caller: SupabaseRest, admin: SupabaseRest, value: unknown, headers: Record<string, string>): Promise<Response> {
  if (typeof value !== 'string') throw new WardrobeError('INVALID_PHOTO');
  const parts = value.split('/');
  if (parts.length !== 4 || !['main.jpg', 'thumb.jpg'].includes(parts[3])) throw new WardrobeError('INVALID_PHOTO');
  const path = `${uuid(parts[0])}/${uuid(parts[1])}/${uuid(parts[2])}/${parts[3]}`;
  // Use the caller JWT, never service_role, for the authorization query. Its RLS
  // checks owner, current invitation, account, item and photo on every request.
  const query = new URLSearchParams({
    or: `(main_path.eq.${path},thumb_path.eq.${path})`,
    select: 'main_path,thumb_path,bytes,thumb_bytes,mime_type', limit: '1',
  });
  const photos = await caller.request(`/rest/v1/wardrobe_photos?${query}`) as ReadablePhoto[];
  const photo = photos.length === 1 ? photos[0] : undefined;
  if (!photo || photo.mime_type !== 'image/jpeg' || (path !== photo.main_path && path !== photo.thumb_path)) {
    throw new WardrobeError('NOT_FOUND', 404);
  }
  const expectedBytes = path === photo.main_path ? photo.bytes : photo.thumb_bytes;
  if (!Number.isSafeInteger(expectedBytes) || expectedBytes < 1 || expectedBytes > (path === photo.main_path ? 1_000_000 : 100_000)) {
    throw new WardrobeError('PHOTO_UNAVAILABLE', 503);
  }
  const bytes = await admin.binary(`/storage/v1/object/wardrobe-private/${path}`, expectedBytes);
  return new Response(bytes.buffer as ArrayBuffer, { headers: {
    ...headers, 'Content-Type': 'image/jpeg', 'Content-Length': String(bytes.byteLength),
    'Cache-Control': 'private, no-store, max-age=0', 'CDN-Cache-Control': 'no-store',
    'Surrogate-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
  } });
}
