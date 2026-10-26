import { uuid, WardrobeError } from './protocol.ts';
import type { SupabaseRest } from './rest.ts';

type PhotoVariant = {path:string;bucket:'wardrobe-private'|'wardrobe-results';mimeType:'image/jpeg'|'image/png';bytes:number;main:boolean};

export async function privatePhotoResponse(caller: SupabaseRest, admin: SupabaseRest, value: unknown, headers: Record<string, string>): Promise<Response> {
  if (typeof value !== 'string') throw new WardrobeError('INVALID_PHOTO');
  const parts = value.split('/');
  if (parts.length !== 4 || !['main.jpg', 'thumb.jpg','main.png','thumb.png'].includes(parts[3])) throw new WardrobeError('INVALID_PHOTO');
  const path = `${uuid(parts[0])}/${uuid(parts[1])}/${uuid(parts[2])}/${parts[3]}`;
  // Use the caller JWT, never service_role, for the authorization query. Its RLS
  // checks owner, current invitation, account, item and photo on every request.
  const photo = await caller.rpc('wardrobe_photo_variant',{p_path:path}) as PhotoVariant|null;
  if (!photo || photo.path!==path || !['wardrobe-private','wardrobe-results'].includes(photo.bucket)
    || !['image/jpeg','image/png'].includes(photo.mimeType) || typeof photo.main!=='boolean') {
    throw new WardrobeError('NOT_FOUND', 404);
  }
  const expectedBytes = photo.bytes;
  if (!Number.isSafeInteger(expectedBytes) || expectedBytes < 1 || expectedBytes > (photo.main ? (photo.bucket==='wardrobe-results'?8_000_000:1_000_000) : 100_000)) {
    throw new WardrobeError('PHOTO_UNAVAILABLE', 503);
  }
  const bytes = await admin.binary(`/storage/v1/object/${photo.bucket}/${path}`, expectedBytes,photo.mimeType);
  // Revalidate after potentially slow Storage I/O. Deletion in flight must not
  // deliver newly authorized bytes based only on an earlier database snapshot.
  const current=await caller.rpc('wardrobe_photo_variant',{p_path:path}) as PhotoVariant|null;
  if(!current||current.path!==photo.path||current.bucket!==photo.bucket||current.mimeType!==photo.mimeType||current.bytes!==photo.bytes||current.main!==photo.main)throw new WardrobeError('NOT_FOUND',404);
  return new Response(bytes.buffer as ArrayBuffer, { headers: {
    ...headers, 'Content-Type': photo.mimeType, 'Content-Length': String(bytes.byteLength),
    'Cache-Control': 'private, no-store, max-age=0', 'CDN-Cache-Control': 'no-store',
    'Surrogate-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
  } });
}
