import type { PrivateSnapshot, VisualizationIntent, VisualizationResult } from './model.ts';
import { PrivateError } from './model.ts';

export function isIntentCurrent(snapshot: PrivateSnapshot | null, intent: VisualizationIntent, now = Date.now()): boolean {
  if (!snapshot || snapshot.bodyFit?.revision !== intent.bodyRevision || snapshot.styling?.revision !== intent.stylingRevision
    || (snapshot.visualization?.consent.revision ?? 0) !== intent.consentRevision || snapshot.visualization?.pilot?.id !== intent.trialId
    || !(Date.parse(intent.expiresAt) > now)) return false;
  const outfit = snapshot.styling.data.outfits.find(value => value.id === intent.outfitId);
  if (!outfit || outfit.itemIds.length < 1 || outfit.itemIds.length > 3 || intent.inputs.length !== outfit.itemIds.length + 1) return false;
  const body = intent.inputs.filter(value => value.kind === 'body');
  const photo = snapshot.bodyFit.photo;
  if (body.length !== 1 || !photo || body[0].photoId !== photo.id || body[0].path !== photo.mainPath || body[0].thumbPath !== photo.thumbPath) return false;
  return outfit.itemIds.every(id => {
    const item = snapshot.items.find(value => value.id === id && value.status === 'active');
    return item?.photo && item.revision === outfit.itemRevisions[id] && intent.inputs.filter(value => value.kind === 'item' && value.photoId === item.photo!.id
      && value.path === item.photo!.mainPath && value.thumbPath === item.photo!.thumbPath && (!value.itemId || value.itemId === id)).length === 1;
  });
}

// Old manifests did not carry the thumbnail MIME. Their variant shared the
// original's format; never infer it from a private storage path extension.
export function resultVariant(result: VisualizationResult, thumbnail: boolean) {
  const mimeType = thumbnail ? result.thumbMimeType ?? result.mimeType : result.mimeType;
  if (mimeType !== 'image/png' && mimeType !== 'image/jpeg') throw new PrivateError('INVALID_RESPONSE');
  return { path: thumbnail ? result.thumbPath : result.mainPath, mimeType, bytes: thumbnail ? result.thumbBytes : result.bytes,
    width: thumbnail ? result.thumbWidth ?? 120 : result.width ?? 1024,
    height: thumbnail ? result.thumbHeight ?? 180 : result.height ?? 1536, extension: mimeType === 'image/png' ? 'png' : 'jpg' };
}
