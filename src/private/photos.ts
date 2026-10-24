import { File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { assertNotAborted, boundedDimensions, inspectPhoto, PHOTO_LIMITS, stripJpegMetadata } from './photos.core.ts';
import { PhotoError, type PhotoSource, type PreparedPhoto, type PreparedPhotoVariant } from './photos.types.ts';

export { PhotoError } from './photos.types.ts';
export type { PreparedPhoto, PhotoSource } from './photos.types.ts';

function removeTemporary(uri: string) {
  // Never remove a user's original in the gallery/documents or an arbitrary provider URI.
  if (!uri.startsWith(Paths.cache.uri) || uri.includes('/../')) return;
  try { const file = new File(uri); if (file.exists) file.delete(); } catch { /* OS cache may already be gone. */ }
}

async function encode(uri: string, width: number, height: number, edge: number, maxBytes: number, signal?: AbortSignal): Promise<PreparedPhotoVariant & { uri: string }> {
  for (const scale of [1, 0.8, 0.6]) {
    assertNotAborted(signal);
    const dimensions = boundedDimensions(width, height, Math.floor(edge * scale));
    const context = ImageManipulator.manipulate(uri);
    context.resize(dimensions);
    const rendered = await context.renderAsync();
    try {
      for (const quality of [0.86, 0.72, 0.55]) {
        assertNotAborted(signal);
        const result = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: quality });
        let retain = false;
        try {
          const file = new File(result.uri);
          const bytes = stripJpegMetadata(await file.bytes());
          assertNotAborted(signal);
          if (bytes.length <= maxBytes) {
            // The preview copy receives the same sanitization as the upload bytes.
            file.write(bytes);
            retain = true;
            return { bytes, mimeType: 'image/jpeg', width: result.width, height: result.height, size: bytes.length, uri: result.uri };
          }
        } finally { if (!retain) removeTemporary(result.uri); }
      }
    } finally { rendered.release(); context.release(); }
  }
  throw new PhotoError('too_large');
}

/** The native decoder normalizes orientation; actual iOS/Android acceptance is a separate device check. */
export async function preparePhoto(asset: ImagePicker.ImagePickerAsset, signal?: AbortSignal): Promise<PreparedPhoto> {
  let main: (PreparedPhotoVariant & { uri: string }) | undefined;
  let thumbnail: (PreparedPhotoVariant & { uri: string }) | undefined;
  let retained = false;
  try {
    assertNotAborted(signal);
    const input = new File(asset.uri);
    if (!input.exists || input.size > PHOTO_LIMITS.inputBytes) throw new PhotoError('too_large');
    inspectPhoto(await input.bytes(), asset.mimeType, asset.fileName ?? '');
    assertNotAborted(signal);
    // Use decoded dimensions, not potentially missing/stale picker width and height.
    const context = ImageManipulator.manipulate(asset.uri);
    const image = await context.renderAsync();
    let width: number;
    let height: number;
    try { width = image.width; height = image.height; boundedDimensions(width, height, PHOTO_LIMITS.mainEdge); }
    finally { image.release(); context.release(); }
    main = await encode(asset.uri, width, height, PHOTO_LIMITS.mainEdge, PHOTO_LIMITS.mainBytes, signal);
    thumbnail = await encode(asset.uri, width, height, PHOTO_LIMITS.thumbnailEdge, PHOTO_LIMITS.thumbnailBytes, signal);
    assertNotAborted(signal);
    const previewUri = main.uri;
    const mainVariant: PreparedPhotoVariant = { bytes: main.bytes, mimeType: main.mimeType, width: main.width, height: main.height, size: main.size };
    const thumbnailVariant: PreparedPhotoVariant = { bytes: thumbnail.bytes, mimeType: thumbnail.mimeType, width: thumbnail.width, height: thumbnail.height, size: thumbnail.size };
    removeTemporary(thumbnail.uri);
    retained = true;
    return {
      main: mainVariant, thumbnail: thumbnailVariant, previewUri,
      dispose() { removeTemporary(previewUri); mainVariant.bytes.fill(0); thumbnailVariant.bytes.fill(0); },
    };
  } catch (error) {
    if (error instanceof PhotoError) throw error;
    throw new PhotoError('decode_failed');
  } finally {
    // ImagePicker creates an app-cache copy; this guard never touches the gallery original.
    removeTemporary(asset.uri);
    if (!retained) {
      if (main) { removeTemporary(main.uri); main.bytes.fill(0); }
      if (thumbnail) { removeTemporary(thumbnail.uri); thumbnail.bytes.fill(0); }
    }
  }
}

export async function pickAndPreparePhoto(source: PhotoSource, signal?: AbortSignal): Promise<PreparedPhoto | null> {
  assertNotAborted(signal);
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    assertNotAborted(signal);
    if (!permission.granted) throw new PhotoError('permission_denied');
  }
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'], allowsEditing: false, allowsMultipleSelection: false,
    exif: false, base64: false, quality: 1,
  };
  const result = source === 'camera'
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled) return null;
  return preparePhoto(result.assets[0], signal);
}
