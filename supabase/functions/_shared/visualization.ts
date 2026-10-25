// P3.3A orchestration contract. No HTTP provider, credentials or runtime switch
// exists here. Retained as the A-stage test contract; the approved B-specific
// worker lives separately in visualization-worker and never imports a fake provider.
export type ImageUsage = { textInputTokens: number; imageInputTokens: number; imageOutputTokens: number };
export type GeneratedImage = { bytes: Uint8Array; thumbnail: Uint8Array; usage: ImageUsage };
export type VisualizationPorts = {
  claimOnce(): Promise<boolean>;
  generateOnce(): Promise<GeneratedImage>;
  inputsCurrent(): Promise<boolean>;
  // Must atomically check deletion/versions and reserve durable, immutable paths
  // with a cleanup lease BEFORE any bytes are written. Null means invalidated.
  stageManifest(bytes: number, thumbnailBytes: number): Promise<string | null>;
  putFile(manifest: string, variant: 'main' | 'thumb', bytes: Uint8Array): Promise<void>;
  // Must recheck current inputs/account/consent transactionally at publication.
  publish(manifest: string): Promise<boolean>;
  deleteLater(manifest: string): Promise<void>;
  settle(outcome: 'succeeded' | 'failed', usage: ImageUsage): Promise<void>;
  unknown(): Promise<void>;
};

function validUsage(value: ImageUsage): boolean {
  return !!value && ['textInputTokens', 'imageInputTokens', 'imageOutputTokens'].every(key => {
    const n = value[key as keyof ImageUsage];
    return Number.isSafeInteger(n) && n >= 0 && n <= 100_000_000;
  });
}

export function validateGeneratedPng(bytes: Uint8Array): void {
  if (bytes.length < 57 || bytes.length > 8_000_000 ||
    ![137,80,78,71,13,10,26,10].every((n,i) => bytes[i] === n)) throw new Error('INVALID_OUTPUT');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8; let idat = false; let end = false;
  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset);
    if (length > bytes.length - offset - 12) throw new Error('INVALID_OUTPUT');
    const tag = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    if (offset === 8 && (tag !== 'IHDR' || length !== 13 || view.getUint32(offset + 8) !== 1024 ||
      view.getUint32(offset + 12) !== 1536 || bytes[offset + 16] !== 8 || ![2,6].includes(bytes[offset + 17]) ||
      bytes[offset + 18] !== 0 || bytes[offset + 19] !== 0 || bytes[offset + 20] > 1)) throw new Error('INVALID_OUTPUT');
    if (offset > 8 && tag === 'IHDR') throw new Error('INVALID_OUTPUT');
    if (tag === 'IDAT' && length > 0) idat = true;
    offset += length + 12;
    if (tag === 'IEND') { if (length !== 0) throw new Error('INVALID_OUTPUT'); end = true; break; }
  }
  if (!idat || !end || offset !== bytes.length) throw new Error('INVALID_OUTPUT');
  // Structural/byte bounds only. Full decoding, metadata and thumbnail CPU must
  // be qualified in B; this check is not an image-quality or authenticity test.
}

export async function runReservedVisualization(ports: VisualizationPorts): Promise<'not-claimed' | 'succeeded' | 'failed' | 'cancelled' | 'unknown'> {
  if (!await ports.claimOnce()) return 'not-claimed';
  let output: GeneratedImage;
  try { output = await ports.generateOnce(); }
  catch { await ports.unknown(); return 'unknown'; }
  if (!validUsage(output.usage)) { await ports.unknown(); return 'unknown'; }
  let manifest: string | null = null;
  let outcome: 'succeeded' | 'failed' | 'cancelled' = 'failed';
  try {
    validateGeneratedPng(output.bytes);
    if (output.thumbnail.length < 1 || output.thumbnail.length > 100_000) throw new Error('INVALID_THUMBNAIL');
    if (!await ports.inputsCurrent()) outcome = 'cancelled';
    else {
      manifest = await ports.stageManifest(output.bytes.length, output.thumbnail.length);
      if (manifest === null) outcome = 'cancelled';
      else {
        await ports.putFile(manifest, 'main', output.bytes);
        await ports.putFile(manifest, 'thumb', output.thumbnail);
        outcome = await ports.publish(manifest) ? 'succeeded' : 'cancelled';
      }
    }
  } catch { outcome = 'failed'; }
  if (manifest && outcome !== 'succeeded') {
    try { await ports.deleteLater(manifest); }
    catch { /* the durable staged manifest remains available to orphan cleanup */ }
  }
  // Known usage is charged also for bad output, failed persistence or deletion.
  // A lost settlement acknowledgement is not a reason to repeat generation.
  try { await ports.settle(outcome === 'succeeded' ? 'succeeded' : 'failed', output.usage); }
  catch { await ports.unknown(); return 'unknown'; }
  return outcome;
}
