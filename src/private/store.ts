import type { AppState } from '../domain/model.ts';
import { WardrobeApi, asPrivateError, type DeleteResult } from './api.ts';
import { bytesToBase64, importReceiptId, mergeP2Import, normalizeItemFields, PrivateError, type PrivateIdentity, type PrivateItem, type PrivateSettings, type PrivateSnapshot, type SaveItemInput } from './model.ts';

export interface UploadPhoto {
  main: { bytes: Uint8Array; mimeType: 'image/jpeg' };
  thumbnail: { bytes: Uint8Array; mimeType: 'image/jpeg' };
}
export interface PrivateView {
  identity: PrivateIdentity | null;
  snapshot: PrivateSnapshot | null;
  loading: boolean;
  busy: boolean;
  error: string | null;
  deletion: DeleteResult | null;
  pendingSave: { itemId: string; baseRevision: number | undefined; revision: number } | null;
}

export class PrivateStore {
  private view: PrivateView = { identity: null, snapshot: null, loading: false, busy: false, error: null, deletion: null, pendingSave: null };
  private generation = 0;
  private listeners = new Set<() => void>();
  private controllers = new Set<AbortController>();
  private photoOperations = new WeakMap<UploadPhoto, string>();
  private stagedSaves = new Map<string, { fields: string; photo?: UploadPhoto; item: PrivateItem }>();
  private refreshVersion = 0;
  private readonly api: WardrobeApi;
  private readonly newId: () => string;
  private readonly clearPhotos: () => void;
  constructor(api: WardrobeApi, newId: () => string, clearPhotos: () => void = () => {}) {
    this.api = api; this.newId = newId; this.clearPhotos = clearPhotos;
  }

  getSnapshot = (): PrivateView => this.view;
  subscribe = (listener: () => void): (() => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private patch(patch: Partial<PrivateView>) { this.view = { ...this.view, ...patch }; this.listeners.forEach(listener => listener()); }
  private assertCurrent(generation: number) { if (generation !== this.generation || !this.view.identity) throw new PrivateError('SESSION_CHANGED'); }
  private controller() { const controller = new AbortController(); this.controllers.add(controller); return controller; }
  setIdentity(identity: PrivateIdentity | null) {
    if (identity?.id === this.view.identity?.id && identity !== null) { this.patch({ identity }); return; }
    this.generation++; this.refreshVersion++;
    this.controllers.forEach(controller => controller.abort()); this.controllers.clear(); this.clearPhotos();
    this.photoOperations = new WeakMap();
    this.stagedSaves.clear();
    this.patch({ identity, snapshot: null, loading: false, busy: false, error: null, deletion: null, pendingSave: null });
  }
  clearError = () => this.patch({ error: null });

  async refresh(): Promise<void> {
    if (!this.view.identity || this.view.busy) return;
    const generation = this.generation; const version = ++this.refreshVersion; const controller = this.controller();
    this.patch({ loading: this.view.snapshot === null });
    try {
      const snapshot = await this.api.bootstrap(controller.signal);
      this.assertCurrent(generation);
      if (version !== this.refreshVersion) return;
      if (snapshot.accountId !== this.view.identity?.id) throw new PrivateError('INVALID_RESPONSE');
      if (JSON.stringify(snapshot) !== JSON.stringify(this.view.snapshot)) {
        const paths = (value: PrivateSnapshot | null) => value?.items.map(item => item.photo?.id ?? '').join('|');
        if (paths(snapshot) !== paths(this.view.snapshot)) this.clearPhotos();
        this.patch({ snapshot });
      }
    } catch (error) {
      if (generation === this.generation && version === this.refreshVersion) this.patch({ error: asPrivateError(error).code });
    } finally {
      this.controllers.delete(controller);
      if (generation === this.generation && version === this.refreshVersion) this.patch({ loading: false });
    }
  }

  private async mutate<T>(work: (signal: AbortSignal, generation: number) => Promise<T>): Promise<T> {
    if (!this.view.identity) throw new PrivateError('SIGNED_OUT');
    if (this.view.busy) throw new PrivateError('BUSY');
    const generation = this.generation; const controller = this.controller();
    this.refreshVersion++; // A prior refresh must not overwrite a newer mutation.
    this.patch({ busy: true, loading: false, error: null, deletion: null });
    try { const result = await work(controller.signal, generation); this.assertCurrent(generation); return result; }
    catch (error) {
      const safe = asPrivateError(error);
      if (generation === this.generation) this.patch({ error: safe.code });
      throw safe;
    } finally {
      this.controllers.delete(controller);
      if (generation === this.generation) this.patch({ busy: false });
    }
  }
  private replaceItem(item: PrivateItem) {
    const snapshot = this.view.snapshot;
    if (!snapshot) return;
    this.clearPhotos();
    this.patch({ snapshot: { ...snapshot, items: [...snapshot.items.filter(existing => existing.id !== item.id), item] } });
  }

  saveSettings = (data: PrivateSettings, expectedRevision: number) => this.mutate(async (signal, generation) => {
    const state = await this.api.saveState(data, expectedRevision, undefined, signal); this.assertCurrent(generation);
    if (this.view.snapshot) this.patch({ snapshot: { ...this.view.snapshot, state } });
    return state;
  });

  saveItem = (input: SaveItemInput, photo?: UploadPhoto) => this.mutate(async (signal, generation) => {
    const fields = normalizeItemFields(input);
    const key = `${input.id}:${input.expectedRevision ?? 'new'}`;
    const staged = this.stagedSaves.get(key);
    const sameStage = staged?.fields === JSON.stringify(fields) && staged?.photo === photo;
    let item = sameStage ? staged.item : staged
      ? await this.api.updateItem(input.id, staged.item.revision, fields, signal)
      : input.expectedRevision === undefined
      ? await this.api.createItem(input.id, fields, signal)
      : await this.api.updateItem(input.id, input.expectedRevision, fields, signal);
    // An uncertain create retry must not claim a different pre-existing record
    // as the newly requested draft or silently overwrite another device's edit.
    if (!staged && input.expectedRevision === undefined && (item.revision !== 1 || JSON.stringify(normalizeItemFields(item)) !== JSON.stringify(fields))) throw new PrivateError('CONFLICT');
    this.assertCurrent(generation); this.replaceItem(item);
    this.stagedSaves.set(key, { fields: JSON.stringify(fields), photo, item });
    this.patch({ pendingSave: { itemId: input.id, baseRevision: input.expectedRevision, revision: item.revision } });
    if (photo) {
      if (photo.main.bytes.length > 1_000_000 || photo.thumbnail.bytes.length > 100_000
        || !photo.main.bytes.length || !photo.thumbnail.bytes.length) throw new PrivateError('PHOTO_TOO_LARGE');
      let operationId = this.photoOperations.get(photo);
      if (!operationId) { operationId = this.newId(); this.photoOperations.set(photo, operationId); }
      item = await this.api.uploadPhoto(item.id, item.revision, operationId, {
        mainBase64: bytesToBase64(photo.main.bytes), thumbBase64: bytesToBase64(photo.thumbnail.bytes), mimeType: 'image/jpeg',
      }, signal);
      this.assertCurrent(generation); this.replaceItem(item);
    }
    this.stagedSaves.delete(key);
    this.patch({ pendingSave: null });
    return item;
  });

  deleteItem = (item: PrivateItem) => this.mutate(async (signal, generation) => {
    const result = await this.api.deleteItem(item.id, item.revision, signal); this.assertCurrent(generation);
    this.clearPhotos();
    if (this.view.snapshot) this.patch({ snapshot: { ...this.view.snapshot, items: this.view.snapshot.items.filter(existing => existing.id !== item.id) }, deletion: result });
    return result;
  });

  deletePhoto = (item: PrivateItem) => this.mutate(async (signal, generation) => {
    const result = await this.api.deletePhoto(item.id, item.revision, signal); this.assertCurrent(generation);
    this.clearPhotos();
    const snapshot = await this.api.bootstrap(signal); this.assertCurrent(generation);
    this.patch({ snapshot, deletion: result }); return result;
  });

  importP2 = (local: AppState, selectedProfileIds: string[], includeFeedback: boolean) => this.mutate(async (signal, generation) => {
    const snapshot = this.view.snapshot; if (!snapshot) throw new PrivateError('NOT_READY');
    const data = mergeP2Import(snapshot.state.data, local, selectedProfileIds, includeFeedback);
    const receipt = importReceiptId(snapshot.accountId, local, selectedProfileIds, includeFeedback);
    const state = await this.api.saveState(data, snapshot.state.revision, receipt, signal); this.assertCurrent(generation);
    this.patch({ snapshot: { ...snapshot, state } }); return state;
  });

  requestAccountDeletion = () => this.mutate(async (signal, generation) => {
    const result = await this.api.deleteAccount(signal); this.assertCurrent(generation);
    this.clearPhotos(); this.patch({ snapshot: null, deletion: result }); return result;
  });

  exportManifest = () => this.mutate(async (signal, generation) => {
    const result = await this.api.export(signal); this.assertCurrent(generation); return result;
  });
  dispose() { this.setIdentity(null); this.listeners.clear(); }
}
