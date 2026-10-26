import { PrivateError, type CanonicalInput, type VisualizationIntent } from './model.ts';
import { inspectPhoto, stripJpegMetadata } from './photos.core.ts';

export const CANONICAL_INPUT_VERSION = 'p33c-jpeg-v1';
const hash = /^[a-f0-9]{64}$/;
export function isCanonicalDescriptor(value: CanonicalInput | undefined): value is CanonicalInput {
  return Boolean(value && value.version === CANONICAL_INPUT_VERSION && hash.test(value.sha256)
    && Number.isInteger(value.bytes) && value.bytes > 0 && value.bytes <= 1_000_000
    && Number.isInteger(value.width) && value.width > 0 && value.width <= 1024
    && Number.isInteger(value.height) && value.height > 0 && value.height <= 1536);
}
export function hasCanonicalInputs(intent: VisualizationIntent): boolean {
  return typeof intent.manifestHash === 'string' && hash.test(intent.manifestHash)
    && intent.inputs.length >= 2 && intent.inputs.length <= 4 && intent.inputs.every(input => isCanonicalDescriptor(input.canonical));
}

/** Check the exact preview bytes; never transform a copy after the server seals it. */
export async function verifyCanonicalInput(bytes: Uint8Array, expected: CanonicalInput, sha256: (bytes: Uint8Array) => Promise<string>): Promise<void> {
  if (!isCanonicalDescriptor(expected) || bytes.length !== expected.bytes) throw new PrivateError('CANONICAL_INPUT_INVALID');
  try {
    const actual = inspectPhoto(bytes, 'image/jpeg');
    if (actual.format !== 'jpeg' || actual.width !== expected.width || actual.height !== expected.height) throw new Error();
    const stripped = stripJpegMetadata(bytes);
    const metadataFree = stripped.length === bytes.length && stripped.every((value, index) => value === bytes[index]);
    stripped.fill(0);
    if (!metadataFree || await sha256(bytes) !== expected.sha256) throw new Error();
  } catch { throw new PrivateError('CANONICAL_INPUT_INVALID'); }
}
