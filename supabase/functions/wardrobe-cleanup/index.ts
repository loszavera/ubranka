import { cleanup, SupabaseRest } from '../_shared/rest.ts';

Deno.serve(async (request: Request) => {
  const expected = Deno.env.get('WARDROBE_CLEANUP_SECRET');
  const received = request.headers.get('x-wardrobe-cleanup');
  if (request.method !== 'POST' || !expected || expected.length < 32 || !received || received.length !== expected.length) {
    return Response.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }
  // Constant-work comparison. The secret is not stored in public SQL or URLs.
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ received.charCodeAt(i);
  if (mismatch) return Response.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return Response.json({ error: 'NOT_CONFIGURED' }, { status: 503 });
  try {
    const result = await cleanup(new SupabaseRest(url, key, undefined, 3000));
    return Response.json(result, { status: result.failed ? 503 : 200 });
  } catch {
    return Response.json({ error: 'CLEANUP_FAILED' }, { status: 503 });
  }
});
