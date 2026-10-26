# C2 — backend admission and operator boundaries

This migration ships OFF. No provider call is part of the scripts/tests below.
Only the database owner may call `wardrobe_private.c_activate`; neither Auth
clients nor service-role HTTP can execute private functions or read private
tables. An operator must verify all approval gates externally before activation.
Never use a test payload, environment switch or mock provider on hosting.

## Contract

`prepareVisualization` authorizes the selected body/outfit snapshot, invokes the
same-project `canonical-input` function separately for each source and seals
descriptors with `wardrobe_c_seal_intent`. `downloadCanonicalInput` regenerates
the exact copy, compares its SHA/dimensions/version and rechecks the intent after
I/O. Original photos stay unchanged. Canonical bytes are RAM-only and no-store.
Descriptors bind `photoId, version, sha256, bytes, width, height`; `manifestHash`
is SHA-256 of the ordered descriptor JSON, calculated on the server.

The single public `requestVisualization` accepts only `operationId, trialId,
intentId, accepted:true, consentVersion:p33c-ai-v1.2, expectedConsentRevision,
expectedManifestHash`. It calls `wardrobe_c_reserve_v2` with fresh Auth identity.
Only a new durable admission (`dispatch:true`) wakes the worker once. Unknown
wake outcome is not retried or cancelled; bootstrap/get recovers its receipt.
Direct authenticated RPC request, old C reserve, old B/A entrypoints remain OFF.

The worker uses `wardrobe_c_worker_plan(p_account,p_id)`, regenerates canonical
bytes, then `wardrobe_c_mark_sent`. It uses the dedicated C key only. After send,
`wardrobe_c_manifest` and `wardrobe_c_complete(...,p_measurements)` work while
operationally OFF so measured cost can settle. Publication still requires the
same consent epoch/input snapshot and the 150-second publication window.
Only numeric timings, a bounded provider response ID and fixed stage/reason
codes are accepted in measurements. No prompt/photo/account text belongs there.

`visualization.monthlyBudget` is the shared UTC month ledger, including earlier
B charges. Legacy `limits` is not reinterpreted. `pilot` remains the 30-day C
ledger and includes `keyDeadline`, `stopReason`, `policyVersion`.

## Free hosted guards and isolated SQL fixture

Use two fresh synthetic `@example.com` accounts, exact local fixture IDs and a
new `p33c-fixture-<UUID>`. Do not inspect ordinary accounts. Reuse
[`tests/operator/c1-concurrency.md`](tests/operator/c1-concurrency.md) for the
owner-only core reservation race: it commits only disposable unsent fixture
receipts, leaves actual `p33c-v1` prepared/OFF, then releases exact holds. No
worker can dispatch such a fixture: C2 accepts only the actual trial ID.

For a fully rolled-back sequential smoke, execute its setup and core admission
in one `BEGIN`/`ROLLBACK` session, without COMMIT or network calls. Validate:

1. Runtime `enabled=false`, actual C prepared, global blocked, B closed before
   and after; existing B/shared-month spend remains identical.
2. Authenticated direct request and service `wardrobe_c_reserve_v2` for this
   fixture fail `AI_DISABLED`; authenticated seal/reserve/worker-plan fail ACL.
3. Owner core reserves A once; B gets `AI_BUSY`; same A UUID returns its receipt;
   another UUID gets `CASE_USED`. There is no `sent_at` or provider cost.
4. `cancel_job` releases both fixture/month holds; a cancelled intent remains
   spent for the fixture. Finish `ROLLBACK` and verify zero fixture rows.

The core test proves the deployed mutex/arithmetic, not the C2 active gate.
`c2-database.test.mjs` exercises actual C2 activation/admission locally with the
same migrations, verified gate booleans and synthetic identities. No hosted
activation is required to claim this local test. If a tool serializes two SQL
calls, use separate SQL-editor/MCP channels and `pg_blocking_pids` for exact
fixture application names, or report that overlap was not demonstrated.

## One-time activation (separate operator action after gates)

Require exact two current invited adult account IDs, an externally confirmed
key expiry timestamp after now and no later than the 30-day pilot end, and all
five verified gates: fundingVerified, autoReloadOff, keyExpiryVerified, qaPassed,
devicesVerified. Call private `c_activate(accounts, key_deadline, gates)` as the
database owner only. This locks global control, rejects active/unknown holds,
preserves previous monthly/B ledgers and initializes C once. It cannot reopen a
closed trial or automatically replace a deleted participant.

For stop, private `c_close('MANUAL_STOP')` blocks admission and cancels only
unsent reservations. Sent/unknown receipts retain holds until known settlement.
At key/trial expiry all admission predicates fail immediately; scheduled
maintenance records closure and releases unsent holds. Key revocation/removal
is a separate operator action; do not claim a database timestamp revokes a key.

After activation, paid sends belong exclusively to users' explicit app clicks.
No operator test calls, auto-retries, additional funding or automatic restart.
The 25 PLN checks limit admission, not the provider's maximum invoice: any
measured over-reservation is charged in full, closes C and remains visible.
