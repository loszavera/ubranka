import { WardrobeError } from './protocol.ts';

const KNOWN_ERRORS = new Set(['CONFLICT','NOT_FOUND','UNAUTHENTICATED','NOT_INVITED','ACCOUNT_UNAVAILABLE',
  'INVALID_STATE','INVALID_ITEM','INVALID_ACTION','ITEM_LIMIT','STORAGE_LIMIT','UPLOAD_PENDING',
  'UPLOAD_INCOMPLETE','DELETE_INCOMPLETE','INVALID_BODY','INVALID_STYLING','STORAGE_CONSENT_REQUIRED',
  'AI_DISABLED','AI_UNAVAILABLE','AI_BUSY','AI_CONSENT_REQUIRED','AI_ATTEMPT_LIMIT','AI_BUDGET_LIMIT','INVALID_USAGE',
  'INVALID_MANIFEST','MANIFEST_MISMATCH','CASE_USED','CALIBRATION_REQUIRED','INVALID_REVIEW']);

export class SupabaseRest {
  private url: string;
  private key: string;
  private authorization: string;
  private timeoutMs: number;
  private deadline?: AbortSignal;
  constructor(url: string, key: string, authorization = `Bearer ${key}`, timeoutMs = 15000, deadline?: AbortSignal) {
    this.url = url; this.key = key; this.authorization = authorization; this.timeoutMs = timeoutMs;
    this.deadline = deadline;
  }

  private signal() {return this.deadline ? AbortSignal.any([this.deadline,AbortSignal.timeout(this.timeoutMs)]) : AbortSignal.timeout(this.timeoutMs);}

  async request(path: string, init: RequestInit = {}): Promise<unknown> {
    const response = await fetch(`${this.url}${path}`, { ...init, signal: this.signal(), headers: {
      apikey: this.key, Authorization: this.authorization,
      ...(init.body && !(init.body instanceof Uint8Array) ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    }});
    const text = await response.text();
    let data: unknown;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }
    if (!response.ok) {
      const message = data && typeof data === 'object' && 'message' in data ? String(data.message) : '';
      if (KNOWN_ERRORS.has(message)) throw new WardrobeError(message, message === 'CONFLICT' ? 409 :
        ['NOT_INVITED','ACCOUNT_UNAVAILABLE','AI_DISABLED'].includes(message) ? 403 : message === 'NOT_FOUND' ? 404 : 400);
      if (path === '/auth/v1/user') throw new WardrobeError('UNAUTHENTICATED', 401);
      if (response.status === 409) throw new WardrobeError('CONFLICT', 409);
      if (response.status >= 400 && response.status < 500) throw new WardrobeError('INVALID_REQUEST');
      throw new WardrobeError('SERVICE_UNAVAILABLE', 503);
    }
    return data;
  }

  rpc(name: string, args: Record<string, unknown> = {}) {
    return this.request(`/rest/v1/rpc/${name}`, { method: 'POST', body: JSON.stringify(args) });
  }

  async binary(path: string, expectedBytes: number, mimeType = 'image/jpeg'): Promise<Uint8Array> {
    const response = await fetch(`${this.url}${path}`, { signal: this.signal(), headers: {
      apikey: this.key, Authorization: this.authorization, 'Cache-Control': 'no-store',
    } });
    if (!response.ok || !response.headers.get('content-type')?.startsWith(mimeType) ||
      Number(response.headers.get('content-length')) > expectedBytes || !response.body) {
      await response.body?.cancel();
      throw new WardrobeError('PHOTO_UNAVAILABLE', 503);
    }
    const reader = response.body.getReader();
    const bytes = new Uint8Array(expectedBytes);
    let offset = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      if (offset + chunk.value.byteLength > expectedBytes) {
        await reader.cancel(); throw new WardrobeError('PHOTO_UNAVAILABLE', 503);
      }
      bytes.set(chunk.value, offset); offset += chunk.value.byteLength;
    }
    if (offset !== expectedBytes) throw new WardrobeError('PHOTO_UNAVAILABLE', 503);
    return bytes;
  }
}

export type PhotoRow = { id: string; account_id: string; item_id: string | null; status: string;
  main_path: string; thumb_path: string; cleanup_attempts: number };

export async function cleanup(admin: SupabaseRest, accountId?: string): Promise<{ pending: number; failed: number }> {
  const deadline = Date.now() + 18000;
  await admin.rpc('wardrobe_expire_uploads');
  const filter = accountId ? `&account_id=eq.${accountId}` : '';
  const photos = await admin.request(`/rest/v1/wardrobe_photos?status=eq.deleting&cleanup_after=lte.${encodeURIComponent(new Date().toISOString())}${filter}&select=id,account_id,item_id,status,main_path,thumb_path,cleanup_attempts&order=cleanup_attempted_at.asc.nullsfirst,created_at.asc&limit=25`) as PhotoRow[];
  let failed = 0;
  for (const photo of photos) {
    if (Date.now() >= deadline) return { pending: 1, failed };
    try {
      await admin.request('/storage/v1/object/wardrobe-private', {
        method: 'DELETE', body: JSON.stringify({ prefixes: [photo.main_path, photo.thumb_path] }),
      });
      await admin.rpc('wardrobe_finish_photo_delete', { p_id: photo.id });
    } catch {
      failed++;
      await admin.request(`/rest/v1/wardrobe_photos?id=eq.${photo.id}`, { method: 'PATCH', body: JSON.stringify({
        cleanup_attempts: photo.cleanup_attempts + 1, cleanup_error: 'STORAGE_DELETE_FAILED', cleanup_attempted_at: new Date().toISOString(),
      }) });
      if (failed >= 3) break;
    }
  }
  if (Date.now() >= deadline) return { pending: 1, failed };
  const files = await admin.request(`/rest/v1/wardrobe_visualization_files?status=eq.deleting&cleanup_after=lte.${encodeURIComponent(new Date().toISOString())}${filter}&select=id,main_path,thumb_path,cleanup_attempts&order=cleanup_attempted_at.asc.nullsfirst,created_at.asc&limit=10`) as PhotoRow[];
  for (const file of files) {
    if (Date.now() >= deadline) return { pending: 1, failed };
    try {
      await admin.request('/storage/v1/object/wardrobe-results', {method:'DELETE',body:JSON.stringify({prefixes:[file.main_path,file.thumb_path]})});
      await admin.rpc('wardrobe_finish_result_delete',{p_id:file.id});
    } catch {
      failed++;
      await admin.request(`/rest/v1/wardrobe_visualization_files?id=eq.${file.id}`,{method:'PATCH',body:JSON.stringify({
        cleanup_attempts:file.cleanup_attempts+1,cleanup_error:'STORAGE_DELETE_FAILED',cleanup_attempted_at:new Date().toISOString()})});
      if(failed>=3)break;
    }
  }
  if (Date.now() >= deadline) return { pending: 1, failed };
  await admin.rpc('wardrobe_finish_item_deletes');
  if (Date.now() >= deadline) return { pending: 1, failed };
  const accountFilter = accountId ? `&id=eq.${accountId}` : '';
  const accounts = await admin.request(`/rest/v1/wardrobe_accounts?status=eq.deleting${accountFilter}&select=id&limit=10`) as {id: string}[];
  for (const account of accounts) {
    if (Date.now() >= deadline) return { pending: 1, failed };
    try {
      if (await admin.rpc('wardrobe_prepare_auth_delete', { p_id: account.id })) {
        await admin.request(`/auth/v1/admin/users/${account.id}`, { method: 'DELETE' });
      }
    } catch { failed++; }
  }
  if (Date.now() >= deadline) return { pending: 1, failed };
  const left = await admin.request(`/rest/v1/wardrobe_photos?status=eq.deleting${filter}&select=id&limit=1`) as unknown[];
  const outputLeft = await admin.request(`/rest/v1/wardrobe_visualization_files?status=eq.deleting${filter}&select=id&limit=1`) as unknown[];
  return { pending: left.length+outputLeft.length, failed };
}
