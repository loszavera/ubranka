import { assertNotAborted, boundedDimensions, inspectPhoto, PHOTO_LIMITS, stripJpegMetadata } from './photos.core.ts';
import { PhotoError, type PhotoSource, type PreparedPhoto, type PreparedPhotoVariant } from './photos.types.ts';

export { PhotoError } from './photos.types.ts';
export type { PreparedPhoto, PhotoSource } from './photos.types.ts';

async function decode(file: Blob): Promise<{ image: CanvasImageSource; width: number; height: number; close(): void }> {
  if (typeof createImageBitmap === 'function') {
    const image = await createImageBitmap(file, { imageOrientation: 'from-image' });
    return { image, width: image.width, height: image.height, close: () => image.close() };
  }
  const url = URL.createObjectURL(file);
  const image = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new PhotoError('decode_failed'));
      image.src = url;
    });
    return { image, width: image.naturalWidth, height: image.naturalHeight, close: () => { image.src = ''; URL.revokeObjectURL(url); } };
  } catch (error) { URL.revokeObjectURL(url); throw error; }
}

async function encode(image: CanvasImageSource, width: number, height: number, edge: number, maxBytes: number, signal?: AbortSignal): Promise<PreparedPhotoVariant> {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new PhotoError('unavailable');
  try {
    for (const scale of [1, 0.8, 0.6]) {
      const dimensions = boundedDimensions(width, height, Math.floor(edge * scale));
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.86, 0.72, 0.55]) {
        assertNotAborted(signal);
        const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
          (value) => value ? resolve(value) : reject(new PhotoError('decode_failed')), 'image/jpeg', quality));
        const bytes = stripJpegMetadata(new Uint8Array(await blob.arrayBuffer()));
        assertNotAborted(signal);
        if (bytes.length <= maxBytes) return { bytes, mimeType: 'image/jpeg', ...dimensions, size: bytes.length };
      }
    }
    throw new PhotoError('too_large');
  } finally { canvas.width = 0; canvas.height = 0; }
}

/** Local-only transformation; never fetches or sends a selected photo. */
export async function preparePhoto(file: File, signal?: AbortSignal): Promise<PreparedPhoto> {
  assertNotAborted(signal);
  if (file.size > PHOTO_LIMITS.inputBytes) throw new PhotoError('too_large');
  inspectPhoto(new Uint8Array(await file.arrayBuffer()), file.type, file.name);
  assertNotAborted(signal);
  let decoded: Awaited<ReturnType<typeof decode>> | undefined;
  let main: PreparedPhotoVariant | undefined;
  let thumbnail: PreparedPhotoVariant | undefined;
  let retained = false;
  try {
    decoded = await decode(file);
    main = await encode(decoded.image, decoded.width, decoded.height, PHOTO_LIMITS.mainEdge, PHOTO_LIMITS.mainBytes, signal);
    thumbnail = await encode(decoded.image, decoded.width, decoded.height, PHOTO_LIMITS.thumbnailEdge, PHOTO_LIMITS.thumbnailBytes, signal);
    assertNotAborted(signal);
    const previewUri = URL.createObjectURL(new Blob([new Uint8Array(main.bytes)], { type: main.mimeType }));
    const result = { main, thumbnail, previewUri, dispose() { URL.revokeObjectURL(previewUri); result.main.bytes.fill(0); result.thumbnail.bytes.fill(0); } };
    retained = true;
    return result;
  } catch (error) {
    if (error instanceof PhotoError) throw error;
    throw new PhotoError('decode_failed');
  } finally {
    decoded?.close();
    if (!retained) { main?.bytes.fill(0); thumbnail?.bytes.fill(0); }
  }
}

/** Must be called directly from a button press to keep the browser's user gesture. */
export async function pickAndPreparePhoto(source: PhotoSource, signal?: AbortSignal): Promise<PreparedPhoto | null> {
  assertNotAborted(signal);
  const file = await new Promise<File | null>((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp,.heic,.heif';
    if (source === 'camera') input.setAttribute('capture', 'environment');
    input.style.display = 'none';
    const clean = () => { signal?.removeEventListener('abort', abort); input.remove(); };
    const abort = () => { clean(); reject(new PhotoError('aborted')); };
    input.addEventListener('change', () => { const selected = input.files?.[0] ?? null; clean(); resolve(selected); }, { once: true });
    input.addEventListener('cancel', () => { clean(); resolve(null); }, { once: true });
    signal?.addEventListener('abort', abort, { once: true });
    document.body.appendChild(input);
    try { input.click(); } catch { clean(); reject(new PhotoError('unavailable')); }
  });
  return file ? preparePhoto(file, signal) : null;
}
