import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { hasCanonicalInputs, isCanonicalDescriptor, verifyCanonicalInput } from '../src/private/canonicalInput.ts';
import type { CanonicalInput, VisualizationIntent } from '../src/private/model.ts';

const sha256 = async (value: Uint8Array) => createHash('sha256').update(value).digest('hex');
// Encoded JPEG marker fixture for the metadata/dimension/hash guard. Browser E2E
// separately decodes a real synthetic JPEG; this fixture makes no decoder claim.
const jpeg = Uint8Array.from([255, 216, 255, 192, 0, 11, 8, 0, 20, 0, 40, 1, 1, 17, 0, 255, 217]);
const descriptor = async (): Promise<CanonicalInput> => ({ version: 'p33c-jpeg-v1', sha256: await sha256(jpeg), bytes: jpeg.length, width: 40, height: 20 });

test('C2 preview is accepted only when exact bytes, dimensions, version and hash match', async () => {
  const expected = await descriptor(); await verifyCanonicalInput(jpeg, expected, sha256);
  await assert.rejects(verifyCanonicalInput(jpeg, { ...expected, sha256: 'f'.repeat(64) }, sha256), /CANONICAL_INPUT_INVALID/);
  await assert.rejects(verifyCanonicalInput(jpeg, { ...expected, width: 20 }, sha256), /CANONICAL_INPUT_INVALID/);
  await assert.rejects(verifyCanonicalInput(jpeg, { ...expected, version: 'later' }, sha256), /CANONICAL_INPUT_INVALID/);
  await assert.rejects(verifyCanonicalInput(jpeg, { ...expected, bytes: jpeg.length + 1 }, sha256), /CANONICAL_INPUT_INVALID/);
});

test('C2 preview rejects metadata and trailing bytes even if their hash was advertised', async () => {
  const expected = await descriptor();
  for (const modified of [Uint8Array.from([...jpeg.slice(0, 2), 255, 225, 0, 5, 69, 88, 73, ...jpeg.slice(2)]), Uint8Array.from([...jpeg, 1, 2])]) {
    await assert.rejects(verifyCanonicalInput(modified, { ...expected, bytes: modified.length, sha256: await sha256(modified) }, sha256), /CANONICAL_INPUT_INVALID/);
  }
});

test('legacy source manifests and malformed canonical limits cannot enable C2 sending', async () => {
  const canonical = await descriptor();
  for (const changes of [{ width: 1600 }, { height: 1600 }, { bytes: 1_000_001 }, { bytes: 0 }, { width: NaN }, { sha256: 'bad' }]) assert.equal(isCanonicalDescriptor({ ...canonical, ...changes }), false);
  const intent = { manifestHash: 'a'.repeat(64), inputs: [{ canonical }, { canonical }] } as VisualizationIntent;
  assert.equal(hasCanonicalInputs(intent), true);
  assert.equal(hasCanonicalInputs({ ...intent, manifestHash: undefined }), false);
  assert.equal(hasCanonicalInputs({ ...intent, inputs: [{ ...intent.inputs[0], canonical: undefined }, intent.inputs[1]] }), false);
});
