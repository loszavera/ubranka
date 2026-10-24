import { cors, fingerprint, jpeg, readBody, revision, safeError, uuid, WardrobeError } from '../_shared/protocol.ts';
import { cleanup, SupabaseRest, type PhotoRow } from '../_shared/rest.ts';
import { privatePhotoResponse } from '../_shared/photo-read.ts';

Deno.serve(async (request: Request) => {
  let headers: Record<string, string> = { 'Cache-Control': 'no-store' };
  try {
    headers = cors(request, Deno.env.get('WARDROBE_ALLOWED_ORIGINS') ?? '');
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') throw new WardrobeError('METHOD_NOT_ALLOWED', 405);
    const url = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !anonKey || !serviceKey) throw new WardrobeError('SERVICE_UNAVAILABLE', 503);
    const authorization = request.headers.get('authorization') ?? '';
    if (!authorization.startsWith('Bearer ')) throw new WardrobeError('UNAUTHENTICATED', 401);
    const caller = new SupabaseRest(url, anonKey, authorization);
    // Auth server validates the JWT and account existence. Never trust decoded
    // client claims, a submitted accountId, or the publishable key as identity.
    const user = await caller.request('/auth/v1/user') as {id: string; email_confirmed_at?: string};
    if (!user.email_confirmed_at) throw new WardrobeError('UNAUTHENTICATED', 401);
    const accountId = uuid(user.id);
    const body = await readBody(request);
    const action = body.action;
    const admin = new SupabaseRest(url, serviceKey);
    const cleanupAdmin = new SupabaseRest(url, serviceKey, undefined, 3000);
    let result: unknown;
    if (action === 'downloadPhoto') return await privatePhotoResponse(caller, admin, body.path, headers);
    if (action === 'uploadPhoto') {
      const itemId = uuid(body.itemId);
      const operationId = uuid(body.operationId);
      const expectedRevision = revision(body.expectedRevision);
      if (body.mimeType !== 'image/jpeg') throw new WardrobeError('INVALID_PHOTO');
      const main = jpeg(body.mainBase64, 1_000_000);
      const thumb = jpeg(body.thumbBase64, 100_000);
      // Validate active invitation before using the privileged storage client.
      await caller.rpc('wardrobe_execute', { p_action: 'bootstrap', p_payload: {} });
      const photo = await admin.rpc('wardrobe_reserve_photo', { p_account: accountId,
        p_item: itemId, p_id: operationId, p_revision: expectedRevision,
        p_bytes: main.byteLength, p_thumb_bytes: thumb.byteLength, p_fingerprint: await fingerprint(main, thumb),
      }) as PhotoRow;
      if (photo.status !== 'active') {
        for (const [path, bytes] of [[photo.main_path, main], [photo.thumb_path, thumb]] as const) {
          await admin.request(`/storage/v1/object/wardrobe-private/${path}`, { method: 'POST', body: new Uint8Array(bytes).buffer,
            headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store', 'x-upsert': 'true' } });
        }
      }
      result = await admin.rpc('wardrobe_commit_photo', { p_account: accountId, p_id: operationId });
      // Old variants are already unreadable. Failures remain durable for cron.
      try { await cleanup(cleanupAdmin, accountId); } catch { /* pending cleanup is retried by the worker */ }
    } else {
      if (typeof action !== 'string' || !['bootstrap','saveState','createItem','updateItem','deleteItem','deletePhoto','deleteAccount','export'].includes(action)) {
        throw new WardrobeError('INVALID_ACTION');
      }
      if (['updateItem','deleteItem','deletePhoto','saveState'].includes(action)) revision(body.expectedRevision);
      if (['createItem','updateItem','deleteItem','deletePhoto'].includes(action)) uuid(body.itemId);
      if (body.importId !== undefined) uuid(body.importId);
      result = await caller.rpc('wardrobe_execute', { p_action: action, p_payload: body });
      if (['deleteItem','deletePhoto','deleteAccount'].includes(action)) {
        try {
          await cleanup(cleanupAdmin, accountId);
          const table = action === 'deleteAccount' ? 'wardrobe_accounts' : action === 'deleteItem' ? 'wardrobe_items' : 'wardrobe_photos';
          const filter = action === 'deleteAccount' ? `id=eq.${accountId}` : action === 'deleteItem' ? `id=eq.${uuid(body.itemId)}` : `account_id=eq.${accountId}&item_id=eq.${uuid(body.itemId)}`;
          const remaining = await admin.request(`/rest/v1/${table}?${filter}&select=id&limit=1`) as unknown[];
          result = { status: remaining.length ? 'pending' : 'deleted' };
        } catch { result = { status: 'pending' }; }
      }
    }
    return Response.json({ data: result }, { headers });
  } catch (error) {
    const { code, status } = safeError(error);
    return Response.json({ error: { code, message: code } }, { status, headers });
  }
});
