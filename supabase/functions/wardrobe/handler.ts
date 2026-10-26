import { cors, fingerprint, jpeg, readBody, revision, safeError, uuid, WardrobeError } from '../_shared/protocol.ts';
import { cleanup, SupabaseRest, type PhotoRow } from '../_shared/rest.ts';
import { privatePhotoResponse } from '../_shared/photo-read.ts';
import { canonicalMatches, prepareCanonicalInputs, type CanonicalInput } from '../_shared/canonical-input.ts';
import { sha256 } from '../_shared/trial.ts';

type PreparedIntent = {id:string;trialId:string;manifestHash:string|null;inputs:CanonicalInput[]};

export function createWardrobeHandler(environment: (key: string) => string | undefined) { return async (request: Request) => {
  let headers: Record<string, string> = { 'Cache-Control': 'no-store' };
  try {
    headers = cors(request, environment('WARDROBE_ALLOWED_ORIGINS') ?? '');
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') throw new WardrobeError('METHOD_NOT_ALLOWED', 405);
    const url = environment('SUPABASE_URL');
    const anonKey = environment('SUPABASE_ANON_KEY');
    const serviceKey = environment('SUPABASE_SERVICE_ROLE_KEY');
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
    if (action === 'setAiConsent' && body.accepted !== false) throw new WardrobeError('AI_DISABLED',403);
    const admin = new SupabaseRest(url, serviceKey);
    const cleanupAdmin = new SupabaseRest(url, serviceKey, undefined, 3000);
    let result: unknown;
    if (action === 'downloadPhoto') return await privatePhotoResponse(caller, admin, body.path, headers);
    if (action === 'requestVisualization') {
      if(body.trialId!=='p33c-v1')throw new WardrobeError('AI_DISABLED',403);
      if(Object.keys(body).some(key=>!['action','operationId','trialId','intentId','accepted','consentVersion','expectedConsentRevision','expectedManifestHash'].includes(key)))throw new WardrobeError('INVALID_REQUEST');
      if(body.accepted!==true||body.consentVersion!=='p33c-ai-v1.2')throw new WardrobeError('AI_CONSENT_REQUIRED');
      const jobId=uuid(body.operationId),intentId=uuid(body.intentId);
      revision(body.expectedConsentRevision);
      if(typeof body.expectedManifestHash!=='string'||!/^[a-f0-9]{64}$/.test(body.expectedManifestHash))throw new WardrobeError('MANIFEST_MISMATCH');
      // Caller gate precedes privileged admission. The SQL transaction checks it
      // again under the shared mutex and binds this exact confirmed manifest.
      const snapshot=await caller.rpc('wardrobe_execute',{p_action:'bootstrap',p_payload:{}}) as {visualization?:{mode?:string}};
      if(snapshot.visualization?.mode!=='private_pilot')throw new WardrobeError('AI_DISABLED',403);
      const admitted=await admin.rpc('wardrobe_c_reserve_v2',{p_account:accountId,p_id:jobId,p_intent:intentId,
        p_epoch:body.expectedConsentRevision,p_manifest_hash:body.expectedManifestHash,p_consent_version:body.consentVersion}) as {job:unknown;dispatch:boolean};
      if(admitted.dispatch===true){
        // Exactly one wake, never a retry. A lost ACK may already mean sent;
        // retain its durable receipt and let read-only recovery/watchdog settle.
        try{await admin.request('/functions/v1/visualization-worker',{method:'POST',body:JSON.stringify({accountId,jobId})});}catch{/* no resubmit or unsafe cancellation */}
      }
      return Response.json({data:admitted.job},{status:202,headers});
    } else if(action==='prepareVisualization') {
      uuid(body.outfitId);revision(body.expectedBodyRevision);revision(body.expectedStylingRevision);
      const intent=await caller.rpc('wardrobe_execute',{p_action:action,p_payload:body}) as PreparedIntent;
      const prepared=await prepareCanonicalInputs(admin,intent.inputs,accountId);
      const hash=await sha256(new TextEncoder().encode(JSON.stringify(prepared.descriptors)));
      result=await admin.rpc('wardrobe_c_seal_intent',{p_account:accountId,p_intent:intent.id,p_canonical:prepared.descriptors,p_manifest_hash:hash});
    } else if(action==='downloadCanonicalInput') {
      const intentId=uuid(body.intentId),photoId=uuid(body.photoId);
      const intent=await caller.rpc('wardrobe_execute',{p_action:'getVisualizationIntent',p_payload:{intentId}}) as PreparedIntent;
      const input=intent.inputs.find(value=>value.photoId===photoId);
      if(!input||!intent.manifestHash||!input.canonical)throw new WardrobeError('NOT_FOUND',404);
      const prepared=await prepareCanonicalInputs(admin,[input],accountId);
      if(!canonicalMatches(input.canonical,prepared.descriptors[0]))throw new WardrobeError('MANIFEST_MISMATCH');
      const current=await caller.rpc('wardrobe_execute',{p_action:'getVisualizationIntent',p_payload:{intentId}}) as PreparedIntent;
      if(current.manifestHash!==intent.manifestHash)throw new WardrobeError('CONFLICT',409);
      return new Response(new Uint8Array(prepared.images[0]).buffer,{headers:{...headers,'Content-Type':'image/jpeg','Content-Length':String(prepared.images[0].length),'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff'}});
    } else if (action === 'uploadPhoto' || action === 'uploadBodyPhoto') {
      const isBody = action === 'uploadBodyPhoto';
      if (isBody && body.storageConsentVersion !== 'p33a-body-v1') throw new WardrobeError('STORAGE_CONSENT_REQUIRED');
      const itemId = isBody ? accountId : uuid(body.itemId);
      const operationId = uuid(body.operationId);
      const expectedRevision = revision(body.expectedRevision);
      if (body.mimeType !== 'image/jpeg') throw new WardrobeError('INVALID_PHOTO');
      const main = jpeg(body.mainBase64, 1_000_000);
      const thumb = jpeg(body.thumbBase64, 100_000);
      // Validate active invitation before using the privileged storage client.
      await caller.rpc('wardrobe_execute', { p_action: 'bootstrap', p_payload: {} });
      const reservation = { p_account: accountId, p_id: operationId, p_revision: expectedRevision,
        p_bytes: main.byteLength, p_thumb_bytes: thumb.byteLength, p_fingerprint: await fingerprint(main, thumb) };
      const photo = await admin.rpc(isBody ? 'wardrobe_reserve_body_photo' : 'wardrobe_reserve_photo', isBody
        ? { ...reservation, p_consent: body.storageConsentVersion }
        : { ...reservation, p_item: itemId }) as PhotoRow;
      if (photo.status !== 'active') {
        for (const [path, bytes] of [[photo.main_path, main], [photo.thumb_path, thumb]] as const) {
          await admin.request(`/storage/v1/object/wardrobe-private/${path}`, { method: 'POST', body: new Uint8Array(bytes).buffer,
            headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store', 'x-upsert': 'true' } });
        }
      }
      result = await admin.rpc(isBody ? 'wardrobe_commit_body_photo' : 'wardrobe_commit_photo', { p_account: accountId, p_id: operationId });
      // Old variants are already unreadable. Failures remain durable for cron.
      try { await cleanup(cleanupAdmin, accountId); } catch { /* pending cleanup is retried by the worker */ }
    } else {
      if (typeof action !== 'string' || !['bootstrap','saveState','createItem','updateItem','deleteItem','deletePhoto','deleteAccount','export',
        'saveBodyFit','deleteBodyPhoto','deleteAiData','saveStyling','getVisualization','cancelVisualization','deleteVisualization','reviewVisualization','getVisualizationIntent','setAiConsent'].includes(action)) {
        throw new WardrobeError('INVALID_ACTION');
      }
      if (['updateItem','deleteItem','deletePhoto','saveState','saveBodyFit','deleteBodyPhoto','deleteAiData','saveStyling','cancelVisualization','deleteVisualization','reviewVisualization'].includes(action)) revision(body.expectedRevision);
      if (['createItem','updateItem','deleteItem','deletePhoto'].includes(action)) uuid(body.itemId);
      if (body.importId !== undefined) uuid(body.importId);
      if (['getVisualization','cancelVisualization','deleteVisualization','reviewVisualization'].includes(action)) uuid(body.jobId);
      if(action==='getVisualizationIntent')uuid(body.intentId);
      if(action==='setAiConsent')revision(body.expectedConsentRevision);
      result = await caller.rpc('wardrobe_execute', { p_action: action, p_payload: body });
      if (['deleteItem','deletePhoto','deleteAccount','deleteBodyPhoto','deleteAiData'].includes(action)) {
        try {
          await cleanup(cleanupAdmin, accountId);
          const table = action === 'deleteAiData' ? 'wardrobe_visualization_files' : action === 'deleteAccount' ? 'wardrobe_accounts' : action === 'deleteItem' ? 'wardrobe_items' : 'wardrobe_photos';
          const filter = action === 'deleteAccount' ? `id=eq.${accountId}` : action === 'deleteItem' ? `id=eq.${uuid(body.itemId)}`
            : action==='deleteAiData' ? `account_id=eq.${accountId}` : action==='deleteBodyPhoto' ? `account_id=eq.${accountId}&kind=eq.body` : `account_id=eq.${accountId}&item_id=eq.${uuid(body.itemId)}`;
          const remaining = await admin.request(`/rest/v1/${table}?${filter}&select=id&limit=1`) as unknown[];
          const remainingResults=action==='deleteAiData'
            ? await admin.request(`/rest/v1/wardrobe_visualization_files?account_id=eq.${accountId}&select=id&limit=1`) as unknown[] : [];
          result = { status: remaining.length || remainingResults.length ? 'pending' : 'deleted' };
        } catch { result = { status: 'pending' }; }
      }
    }
    return Response.json({ data: result }, { headers });
  } catch (error) {
    const { code, status } = safeError(error);
    return Response.json({ error: { code, message: code } }, { status, headers });
  }
}; }
