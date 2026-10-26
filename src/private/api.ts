import { PRIVATE_AI_CONSENT, PrivateError, type AiConsent, type VisualizationIntent, type VisualizationReview, type VisualizationJob, type BodyFit, type BodyFitData, type StylingData, type StylingState, type CloudState, type ExportManifest, type ItemFields, type PrivateItem, type PrivateSettings, type PrivateSnapshot } from './model.ts';

export type WardrobeCall = <T>(action: string, payload?: Record<string, unknown>, signal?: AbortSignal) => Promise<T>;
export interface DeleteResult { status: 'deleted' | 'pending' }
export interface PhotoUpload { mainBase64: string; thumbBase64: string; mimeType: 'image/jpeg' }

export class WardrobeApi {
  readonly call: WardrobeCall;
  constructor(call: WardrobeCall) { this.call = call; }
  bootstrap(signal?: AbortSignal) { return this.call<PrivateSnapshot>('bootstrap', {}, signal); }
  saveState(data: PrivateSettings, expectedRevision: number, importId?: string, signal?: AbortSignal) {
    return this.call<CloudState>('saveState', { data, expectedRevision, ...(importId ? { importId } : {}) }, signal);
  }
  createItem(itemId: string, fields: ItemFields, signal?: AbortSignal) { return this.call<PrivateItem>('createItem', { itemId, ...fields }, signal); }
  updateItem(itemId: string, expectedRevision: number, fields: ItemFields, signal?: AbortSignal) {
    return this.call<PrivateItem>('updateItem', { itemId, expectedRevision, ...fields }, signal);
  }
  uploadPhoto(itemId: string, expectedRevision: number, operationId: string, photo: PhotoUpload, signal?: AbortSignal) {
    return this.call<PrivateItem>('uploadPhoto', { itemId, expectedRevision, operationId, ...photo }, signal);
  }
  deleteItem(itemId: string, expectedRevision: number, signal?: AbortSignal) {
    return this.call<DeleteResult>('deleteItem', { itemId, expectedRevision }, signal);
  }
  deletePhoto(itemId: string, expectedRevision: number, signal?: AbortSignal) {
    return this.call<DeleteResult>('deletePhoto', { itemId, expectedRevision }, signal);
  }
  saveBodyFit(data: BodyFitData, expectedRevision: number, signal?: AbortSignal) {
    return this.call<BodyFit>('saveBodyFit', { data, expectedRevision }, signal);
  }
  uploadBodyPhoto(expectedRevision: number, operationId: string, photo: PhotoUpload, storageConsentVersion: string, signal?: AbortSignal) {
    return this.call<BodyFit>('uploadBodyPhoto', { expectedRevision, operationId, ...photo, storageConsentVersion }, signal);
  }
  deleteBodyPhoto(expectedRevision: number, signal?: AbortSignal) {
    return this.call<DeleteResult>('deleteBodyPhoto', { expectedRevision }, signal);
  }
  saveStyling(data: StylingData, expectedRevision: number, signal?: AbortSignal) {
    return this.call<StylingState>('saveStyling', { data, expectedRevision }, signal);
  }
  getVisualization(jobId: string, signal?: AbortSignal) { return this.call<VisualizationJob>('getVisualization', { jobId }, signal); }
  prepareVisualization(trialId: string, outfitId: string, expectedBodyRevision: number, expectedStylingRevision: number, signal?: AbortSignal) {
    return this.call<VisualizationIntent>('prepareVisualization', { trialId, outfitId, expectedBodyRevision, expectedStylingRevision }, signal);
  }
  getVisualizationIntent(intentId: string, signal?: AbortSignal) { return this.call<VisualizationIntent>('getVisualizationIntent', { intentId }, signal); }
  requestPrivateVisualization(operationId: string, intent: VisualizationIntent, signal?: AbortSignal) {
    return this.call<VisualizationJob>('requestVisualization', { operationId, trialId: intent.trialId, intentId: intent.id, accepted: true, consentVersion: PRIVATE_AI_CONSENT, expectedConsentRevision: intent.consentRevision, expectedManifestHash: intent.manifestHash }, signal);
  }
  revokeAiConsent(expectedConsentRevision: number, signal?: AbortSignal) {
    return this.call<AiConsent>('setAiConsent', { accepted: false, consentVersion: PRIVATE_AI_CONSENT, expectedConsentRevision }, signal);
  }
  requestVisualization(operationId: string, caseId: string, signal?: AbortSignal) {
    return this.call<VisualizationJob>('requestVisualization', { operationId, caseId, consentVersion: 'p33b-synthetic-v1', accepted: true }, signal);
  }
  reviewVisualization(jobId: string, expectedRevision: number, review: VisualizationReview, signal?: AbortSignal) {
    return this.call<VisualizationJob>('reviewVisualization', { jobId, expectedRevision, ...review }, signal);
  }
  cancelVisualization(jobId: string, expectedRevision: number, signal?: AbortSignal) { return this.call<VisualizationJob>('cancelVisualization', { jobId, expectedRevision }, signal); }
  deleteVisualization(jobId: string, expectedRevision: number, signal?: AbortSignal) { return this.call<DeleteResult>('deleteVisualization', { jobId, expectedRevision }, signal); }
  deleteAiData(expectedRevision: number, signal?: AbortSignal) { return this.call<DeleteResult>('deleteAiData', { expectedRevision }, signal); }
  deleteAccount(signal?: AbortSignal) { return this.call<DeleteResult>('deleteAccount', {}, signal); }
  export(signal?: AbortSignal) { return this.call<ExportManifest>('export', {}, signal); }
}

// Avoid showing raw provider messages, URLs or tokens in the UI/logs.
export function asPrivateError(error: unknown): PrivateError {
  if (error instanceof PrivateError) return error;
  if (error instanceof Error && error.name === 'AbortError') return new PrivateError('CANCELLED');
  return new PrivateError('NETWORK');
}

export function createWardrobeCall(options: {
  url: string;
  publishableKey: string;
  accessToken: () => Promise<string | null>;
  fetch?: typeof fetch;
}): WardrobeCall {
  const fetcher = options.fetch ?? fetch;
  return async <T>(action: string, payload: Record<string, unknown> = {}, signal?: AbortSignal): Promise<T> => {
    const token = await options.accessToken();
    if (!token) throw new PrivateError('SIGNED_OUT');
    try {
      const response = await fetcher(`${options.url}/functions/v1/wardrobe`, {
        method: 'POST', signal, cache: 'no-store',
        headers: { apikey: options.publishableKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (body && typeof body === 'object' && 'error' in body) {
        const error = body.error;
        if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
          && /^[A-Z_]{2,50}$/.test(error.code)) throw new PrivateError(error.code);
      }
      if (!response.ok) throw new PrivateError(response.status === 409 ? 'CONFLICT' : response.status === 401 ? 'SIGNED_OUT' : 'SERVICE');
      if (!body || typeof body !== 'object' || !('data' in body)) throw new PrivateError('INVALID_RESPONSE');
      return body.data as T;
    } catch (error) { throw asPrivateError(error); }
  };
}
