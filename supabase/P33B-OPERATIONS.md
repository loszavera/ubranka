# P3.3B backend: finite synthetic trial

This is an operator contract, not authorization to activate services or call AI.
The implementation agent made **zero provider calls, key reads or cloud changes**.
P3.3C remains disabled. `wardrobe_private.ai_enabled()` is still hard false;
B uses separate service-only admission against an immutable six-case manifest.

## Provision and activation

Deploy the additive migration, then `wardrobe`, `wardrobe-cleanup` and
`visualization-worker`. No change to the existing ten-minute cleanup schedule.
The worker alone reads `UBRANKA_P33B_OPENAI_KEY`. Never add it to a client,
EXPO_PUBLIC, Vercel, Git, operator SQL, or logs.

`wardrobe_b_provision({p_manifest})` accepts:

```json
{
  "id": "p33b-v1",
  "manifestSha256": "SHA256 of the frozen manifest artifact",
  "cases": [{
    "id": "B01", "accountId": "synthetic Auth UUID", "label": "Synthetic case",
    "outfitId": "saved outfit UUID", "bodyRevision": 1, "stylingRevision": 1,
    "inputPhotoIds": ["body photo UUID", "item photo UUIDs in exact order"],
    "inputHashes": ["SHA256 of each actual uploaded main JPEG in the same order"],
    "prompt": "frozen instruction", "promptSha256": "SHA256 of UTF-8 prompt",
    "params": {
      "model": "gpt-image-2.5-flare-2026-09-08", "n": 1, "quality": "medium",
      "size": "1024x1536", "output_format": "png", "background": "opaque",
      "moderation": "auto"
    }
  }]
}
```

Exactly B01–B06. B01/B03/B05 belong to one dedicated account and B02/B04/B06
to the other, with email pattern `p33b-…@example.com`. Ordinary OAuth accounts
cannot be provisioned. All three outfits must already exist before freezing
their shared styling revision. Occasions: casual, elegant, wedding respectively.
B05 uses dress + shoes (three images including body); B01 uses four images.
No accounts or their identifiers are committed to this repository.

Provision is one-shot and does not activate generation. After all unpaid gates
and separate finance/key authorization, the operator calls
`wardrobe_b_activate({p_manifest_sha256})` once. It opens exactly 24 hours.
`wardrobe_b_close()` permanently closes this trial. No RPC resets a case,
spend or activation window. New trial authorization requires a new reviewed
change, not editing an account flag.

## Public protocol

Existing bootstrap/export adds `visualization.trial` (null for ordinary users).
An enrolled user sees `mode:'synthetic_trial'` only while activated/unblocked;
the trial and case slot history remain available after mode returns to off.
Trial: `id,endsAt,budgetPln,spentPln,reservedPln,maxSends,sentCount,blocked,cases`.
Cases: `id,label,personPath,itemPaths,reservePln,model,promptVersion,jobId,sent`.
After physical input deletion preview paths may be empty. This never clears jobId.

`requestVisualization` requires `{operationId,caseId,accepted:true,
consentVersion:'p33b-synthetic-v1'}`. It returns the durable job with HTTP 202.
UUID must exist before POST; after lost response read bootstrap/getVisualization,
never retry POST. The server still enforces at most one send per case across UUIDs.
Direct authenticated SQL `requestVisualization` remains denied; Edge checks
actual JPEG bytes/hashes before service admission and worker repeats this check.

`reviewVisualization` takes jobId, expectedRevision, scores (person, garments,
completeness, artifacts, usefulness: integers 0–2), criticalError and note≤1000.
It does not change styling feedback. Successful job/result expiry is 30 days.
Result: `mainPath,thumbPath,bytes,thumbBytes,mimeType:'image/png',
thumbMimeType:'image/png',expiresAt`. Both download through `downloadPhoto` POST.
No direct Storage policies or signed URLs. Caller RLS is checked before and
after privileged byte download. Export includes the same authorized results.

## Limits and lifecycle

Global lock precedes account/job locks; no lock spans network I/O. First case
reserves all 1000 groszy. Later reserve is max(100, 2×largest measured rounded
cost in groszy +20). Existing monthly ledger also applies. At most six sent
cases, three per account, within the existing five sends/account/day.
Case IDs and aggregate costs survive deletion; user references are cleared
when the synthetic account is deleted. Deleting outputs does not refund usage.

`reserved → sent` commits before exactly one raw fetch. Provider timeout 90 s;
work budget 110 s plus bounded 8 s settlement fits the 120 s target. Lost/unknown
usage retains its reservation and blocks the trial. No transport, worker,
provider, upload, or model fallback retry is configured. A sent watchdog after
five minutes makes interrupted work unknown. Unsent jobs expire after 15 min.

PNG≤8,000,000 bytes and thumbnail≤100,000 bytes use bucket `wardrobe-results`.
The durable manifest reserves exact bytes before either upload; RLS allows
only active results of succeeded/current jobs. Completion atomically settles
known usage and checks current account, invitation, consent, input revisions,
trial window, cancellation, manifest and both Storage objects before publishing.
Invalid/partial/late output remains unreadable and queued for Storage API cleanup.
A five-minute upload lease prevents late writers recreating forgotten objects.
The 100 MB AI sublimit shares the 250 MB account limit with all photo variants.
Account/Auth deletion waits for files and in-flight work; unknown spend survives.

## Unpaid operator probes and hosted fixtures

Service-authenticated `visualization-worker` supports two isolated probes:

- `X-Ubranka-Probe: png`, `Content-Type: image/png`, raw PNG≤8,000,000 bytes.
- `X-Ubranka-Probe: json`, `Content-Type: application/json`, normal synthetic
  Images JSON response≤11,000,000 bytes, including consistent usage and base64.

Both return only dimensions, byte counts and decoder/timing metrics. They do
not read an OpenAI key, create jobs, store images, or call a provider. JSON probe
includes the actual response/base64 parser. Hosted CPU/RAM evidence is required;
local Deno process RSS is not Supabase worker memory qualification.

Worker authentication uses the no-data `wardrobe_worker_authorized()` RPC
(`SECURITY INVOKER`, EXECUTE only service_role), letting PostgREST validate the
caller instead of comparing different valid server keys literally. Legacy
Bearer is verified with the server's **public** gateway key; a modern secret
is checked on apikey at this same restricted RPC. The worker's privileged data
client still uses only its own environment key, never the caller's credential.
Modern environment fallback is the documented `SUPABASE_SECRET_KEYS.default`
and `SUPABASE_PUBLISHABLE_KEYS.default`; missing config fails closed. No auth
user records are read. See https://supabase.com/docs/guides/functions/secrets
and https://supabase.com/docs/guides/getting-started/api-keys.

Operator SQL under `tests/hosted-*.sql` is **not deployed as functions**:
`hosted-trial-smoke.sql` exercises six SQL transitions inside a rollback;
result setup/activate/teardown files create only exact synthetic Storage fixtures.
Substitute base64 JSON placeholders, never raw unescaped SQL. Test before real
provision. A test reservation on the actual trial consumes a permanent case slot.
Delete fixture objects using Storage API/existing cron before metadata teardown;
never invoke global cleanup manually or delete only Storage metadata.

## Local verification and boundaries

PGlite executes migrations/RPC/RLS with only managed Auth/Storage tables stubbed.
Node protocol tests mock fetch; no provider calls. The decoder tests use actual
synthetic PNG pixels. SQL smoke/fixture scripts are also executed locally.
Single PGlite connection is not a hosted concurrency or OAuth test.

```powershell
node --experimental-strip-types --test supabase/tests/database.test.mjs supabase/tests/styling-database.test.mjs supabase/tests/trial-database.test.mjs supabase/tests/protocol.test.ts supabase/tests/cleanup.test.ts supabase/tests/styling-protocol.test.ts supabase/tests/trial-protocol.test.ts
npx --yes deno@2.9.6 check --config supabase/functions/deno.json supabase/functions/wardrobe/index.ts supabase/functions/wardrobe-cleanup/index.ts supabase/functions/visualization-worker/index.ts
npx --yes deno@2.9.6 test --config supabase/functions/deno.json --allow-read --allow-env supabase/tests/png-codec.deno.ts
```

Provider contract: https://developers.openai.com/api/reference/resources/images/methods/edit
Runtime limits: https://supabase.com/docs/guides/functions/limits
Background tasks are bounded continuation, not durable retry:
https://supabase.com/docs/guides/functions/background-tasks
