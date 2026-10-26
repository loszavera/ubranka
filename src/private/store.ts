import type { AppState } from '../domain/model.ts';
import { WardrobeApi, asPrivateError, type DeleteResult } from './api.ts';
import type { AttemptReceipt, AttemptReceiptJournal } from './attemptReceipt.ts';
import { isIntentCurrent } from './visualization.ts';
import { hasCanonicalInputs } from './canonicalInput.ts';
import { BODY_STORAGE_CONSENT, bytesToBase64, importReceiptId, mergeP2Import, normalizeBodyFitData, normalizeItemFields, PrivateError, type VisualizationIntent, type VisualizationJob, type VisualizationReview, type BodyFitData, type StylingData, type PrivateIdentity, type PrivateItem, type PrivateSettings, type PrivateSnapshot, type SaveItemInput } from './model.ts';

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
  // Photo-only/account notices. Item cleanup is represented by snapshot tombstones.
  deletion: DeleteResult | null;
  pendingSave: { itemId: string; baseRevision: number | undefined; revision: number } | null;
  visualizationAttempt: (AttemptReceipt & { status: 'sending' | 'accepted' | 'unconfirmed' }) | null;
}

const ACCESS_REVOKED = new Set(['UNAUTHENTICATED', 'ACCOUNT_UNAVAILABLE', 'NOT_INVITED', 'SIGNED_OUT']);

export class PrivateStore {
  private view: PrivateView = { identity: null, snapshot: null, loading: false, busy: false, error: null, deletion: null, pendingSave: null, visualizationAttempt: null };
  private attemptedCases = new Set<string>();
  private attemptedPrivateInputs = new Set<string>();
  private generation = 0;
  private listeners = new Set<() => void>();
  private controllers = new Set<AbortController>();
  private photoOperations = new WeakMap<UploadPhoto, string>();
  private stagedSaves = new Map<string, { fields: string; photo?: UploadPhoto; item: PrivateItem }>();
  private refreshVersion = 0;
  private readonly api: WardrobeApi;
  private readonly newId: () => string;
  private readonly clearPhotos: () => void;
  private readonly attemptJournal?: AttemptReceiptJournal;
  constructor(api: WardrobeApi, newId: () => string, clearPhotos: () => void = () => {}, attemptJournal?: AttemptReceiptJournal) {
    this.api = api; this.newId = newId; this.clearPhotos = clearPhotos;
    this.attemptJournal = attemptJournal;
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
    this.attemptedCases.clear();
    this.attemptedPrivateInputs.clear();
    this.patch({ identity, snapshot: null, loading: false, busy: false, error: null, deletion: null, pendingSave: null, visualizationAttempt: null });
  }
  clearError = () => this.patch({ error: null });
  private reportFailure(code: string) {
    // An authoritative denial invalidates controlled private data on this device.
    // A network failure is different: preserve the loaded snapshot and draft.
    if (ACCESS_REVOKED.has(code)) this.setIdentity(null);
    this.patch({ error: code });
  }

  async refresh(): Promise<void> {
    if (!this.view.identity || this.view.busy) return;
    const generation = this.generation; const version = ++this.refreshVersion; const controller = this.controller();
    this.patch({ loading: this.view.snapshot === null });
    try {
      const snapshot = await this.api.bootstrap(controller.signal);
      this.assertCurrent(generation);
      if (version !== this.refreshVersion) return;
      if (snapshot.accountId !== this.view.identity?.id) throw new PrivateError('INVALID_RESPONSE');
      if (this.attemptJournal && snapshot.visualization) {
        const receipts = await this.attemptJournal.read(snapshot.accountId); this.assertCurrent(generation);
        if (version !== this.refreshVersion) return;
        for (const receipt of receipts) {
          if (receipt.caseId) this.attemptedCases.add(receipt.caseId);
          const known = snapshot.visualization.jobs.some(job => job.id === receipt.id) || snapshot.visualization.trial?.cases.some(value => value.id === receipt.caseId && value.jobId === receipt.id);
          if (known) {
            await this.attemptJournal.remove(snapshot.accountId, receipt.id); this.assertCurrent(generation);
            if (this.view.visualizationAttempt?.id === receipt.id) this.patch({ visualizationAttempt: { ...receipt, status: 'accepted' } });
          }
          else this.patch({ visualizationAttempt: { ...receipt, status: 'unconfirmed' } });
        }
        if (version !== this.refreshVersion) return;
      }
      if (JSON.stringify(snapshot) !== JSON.stringify(this.view.snapshot)) {
        const paths = (value: PrivateSnapshot | null) => `${value?.items.map(item => item.photo?.id ?? '').join('|')}|${value?.bodyFit?.photo?.id ?? ''}|${value?.visualization?.jobs.map(job => job.result ? `${job.result.mainPath}:${job.result.thumbPath}` : '').join('|')}`;
        if (paths(snapshot) !== paths(this.view.snapshot)) this.clearPhotos();
        this.patch({ snapshot });
      }
      const attempt = this.view.visualizationAttempt;
      if (attempt && (snapshot.visualization?.jobs.some(job => job.id === attempt.id) || snapshot.visualization?.trial?.cases.some(value => value.id === attempt.caseId && value.jobId === attempt.id))) this.patch({ visualizationAttempt: { ...attempt, status: 'accepted' } });
    } catch (error) {
      if (generation === this.generation && version === this.refreshVersion) this.reportFailure(asPrivateError(error).code);
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
      if (generation === this.generation) this.reportFailure(safe.code);
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
    this.hideVisualizationResults(item.id);
  }

  private hideVisualizationResults(itemId?: string) {
    const snapshot = this.view.snapshot;
    if (!snapshot?.visualization) return;
    const affected = itemId ? new Set(snapshot.styling?.data.outfits.filter(outfit => outfit.itemIds.includes(itemId)).map(outfit => outfit.id) ?? []) : null;
    // The server invalidates dependent jobs. Hide controlled result copies as
    // soon as a mutation is acknowledged, even if the follow-up refresh fails.
    // Preserve ledger/status until the authoritative snapshot arrives.
    this.patch({ snapshot: { ...snapshot, visualization: { ...snapshot.visualization, jobs: snapshot.visualization.jobs.map(job => !affected || affected.has(job.outfitId) ? { ...job, result: null } : job) } } });
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
    this.hideVisualizationResults(item.id);
    // Keep the reserved slot until the server confirms physical cleanup. The
    // next bootstrap also includes this tombstone, so reload cannot restore a
    // deleted card or temporarily make an occupied quota slot look available.
    if (this.view.snapshot) this.patch({ snapshot: { ...this.view.snapshot, items: result.status === 'pending'
      ? this.view.snapshot.items.map(existing => existing.id === item.id ? { ...existing, status: 'deleting', photo: null } : existing)
      : this.view.snapshot.items.filter(existing => existing.id !== item.id) } });
    return result;
  });

  deletePhoto = (item: PrivateItem) => this.mutate(async (signal, generation) => {
    const result = await this.api.deletePhoto(item.id, item.revision, signal); this.assertCurrent(generation);
    this.clearPhotos();
    this.hideVisualizationResults(item.id);
    if (this.view.snapshot) this.patch({ snapshot: { ...this.view.snapshot, items: this.view.snapshot.items.map(existing => existing.id === item.id ? { ...existing, photo: null } : existing) } });
    const snapshot = await this.api.bootstrap(signal); this.assertCurrent(generation);
    this.patch({ snapshot, deletion: result }); return result;
  });

  saveBodyFit = (data: BodyFitData, expectedRevision: number) => this.mutate(async (signal, generation) => {
    const bodyFit = await this.api.saveBodyFit(normalizeBodyFitData(data), expectedRevision, signal); this.assertCurrent(generation);
    if (this.view.snapshot) this.patch({ snapshot: { ...this.view.snapshot, bodyFit } });
    this.clearPhotos(); this.hideVisualizationResults();
    return bodyFit;
  });

  uploadBodyPhoto = (expectedRevision: number, photo: UploadPhoto, consent: boolean) => this.mutate(async (signal, generation) => {
    if (!consent) throw new PrivateError('STORAGE_CONSENT_REQUIRED');
    if (!photo.main.bytes.length || !photo.thumbnail.bytes.length || photo.main.bytes.length > 1_000_000 || photo.thumbnail.bytes.length > 100_000) throw new PrivateError('PHOTO_TOO_LARGE');
    let operationId = this.photoOperations.get(photo);
    if (!operationId) { operationId = this.newId(); this.photoOperations.set(photo, operationId); }
    const bodyFit = await this.api.uploadBodyPhoto(expectedRevision, operationId, {
      mainBase64: bytesToBase64(photo.main.bytes), thumbBase64: bytesToBase64(photo.thumbnail.bytes), mimeType: 'image/jpeg',
    }, BODY_STORAGE_CONSENT, signal); this.assertCurrent(generation);
    this.clearPhotos();
    if (this.view.snapshot) this.patch({ snapshot: { ...this.view.snapshot, bodyFit } });
    this.hideVisualizationResults();
    return bodyFit;
  });

  deleteBodyPhoto = (expectedRevision: number) => this.mutate(async (signal, generation) => {
    const result = await this.api.deleteBodyPhoto(expectedRevision, signal); this.assertCurrent(generation);
    this.clearPhotos();
    this.hideVisualizationResults();
    const current = this.view.snapshot;
    if (current?.bodyFit) this.patch({ snapshot: { ...current, bodyFit: { ...current.bodyFit, photo: null, photoDeletion: result.status === 'pending' ? 'pending' : null } } });
    const snapshot = await this.api.bootstrap(signal); this.assertCurrent(generation);
    this.patch({ snapshot }); return result;
  });

  saveStyling = (data: StylingData, expectedRevision: number) => this.mutate(async (signal, generation) => {
    const styling = await this.api.saveStyling(data, expectedRevision, signal); this.assertCurrent(generation);
    if (this.view.snapshot) this.patch({ snapshot: { ...this.view.snapshot, styling } });
    return styling;
  });

  private replaceVisualization(job: VisualizationJob) {
    const current = this.view.snapshot;
    if (!current?.visualization) return;
    const existing = current.visualization.jobs.find(value => value.id === job.id);
    if (existing && existing.revision > job.revision) return;
    if (existing?.result?.mainPath !== job.result?.mainPath) this.clearPhotos();
    this.patch({ snapshot: { ...current, visualization: { ...current.visualization, jobs: [...current.visualization.jobs.filter(value => value.id !== job.id), job] } } });
  }

  requestVisualization = (operationId: string, caseId: string, accepted: boolean) => this.mutate(async (signal, generation) => {
    const accountId = this.view.identity!.id;
    const visual = this.view.snapshot?.visualization; const trial = visual?.trial;
    const selected = trial?.cases.find(value => value.id === caseId);
    if (!accepted) throw new PrivateError('AI_CONSENT_REQUIRED');
    if (!/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(operationId)) throw new PrivateError('INVALID_INPUT');
    if (visual?.mode !== 'synthetic_trial' || !trial || !selected || !trial.endsAt || !(Date.parse(trial.endsAt) > Date.now())) throw new PrivateError('AI_DISABLED');
    if (trial.blocked || trial.reservedPln > 0 || trial.sentCount >= trial.maxSends || selected.sent || selected.jobId || this.attemptedCases.has(caseId)
      || this.view.visualizationAttempt?.status === 'unconfirmed' || visual.jobs.some(job => ['reserved', 'sent', 'outcome_unknown'].includes(job.status))) throw new PrivateError('TRIAL_BLOCKED');
    if (!Number.isFinite(selected.reservePln) || selected.reservePln <= 0 || trial.spentPln + trial.reservedPln + selected.reservePln > trial.budgetPln + 0.000001) throw new PrivateError('TRIAL_BLOCKED');
    this.attemptedCases.add(caseId);
    this.patch({ visualizationAttempt: { id: operationId, caseId, status: 'sending' } });
    try {
      await this.attemptJournal?.write(accountId, { id: operationId, caseId }); this.assertCurrent(generation);
      // Exactly one POST per explicit attempt. A failed/unknown response is
      // recovered by reads of this UUID, never by replaying this request.
      const job = await this.api.requestVisualization(operationId, caseId, signal); this.assertCurrent(generation);
      if (job.id !== operationId) throw new PrivateError('INVALID_RESPONSE');
      this.replaceVisualization(job);
      this.patch({ visualizationAttempt: { id: operationId, caseId, status: 'accepted' } });
      const current = this.view.snapshot!;
      if (current.visualization?.trial) this.patch({ snapshot: { ...current, visualization: { ...current.visualization, trial: { ...current.visualization.trial, cases: current.visualization.trial.cases.map(value => value.id === caseId ? { ...value, jobId: job.id } : value) } } } });
      return job;
    } catch (error) {
      if (generation === this.generation) this.patch({ visualizationAttempt: { id: operationId, caseId, status: 'unconfirmed' } });
      throw error;
    }
  });

  prepareVisualization = (outfitId: string) => this.mutate(async (signal, generation) => {
    const snapshot = this.view.snapshot;
    if (!snapshot?.bodyFit || !snapshot.styling || !snapshot.visualization?.pilot) throw new PrivateError('AI_DISABLED');
    const intent = await this.api.prepareVisualization(snapshot.visualization.pilot.id, outfitId, snapshot.bodyFit.revision, snapshot.styling.revision, signal);
    this.assertCurrent(generation);
    if (!isIntentCurrent(this.view.snapshot, intent)) throw new PrivateError('CONFLICT');
    if (!hasCanonicalInputs(intent)) throw new PrivateError('CANONICAL_INPUT_INVALID');
    return intent;
  });

  requestPrivateVisualization = (operationId: string, intent: VisualizationIntent, accepted: boolean) => this.mutate(async (signal, generation) => {
    const accountId = this.view.identity!.id; const visual = this.view.snapshot?.visualization; const pilot = visual?.pilot;
    if (!accepted) throw new PrivateError('AI_CONSENT_REQUIRED');
    if (!/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(operationId)) throw new PrivateError('INVALID_INPUT');
    if (visual?.mode !== 'private_pilot' || !pilot?.eligible || pilot.status !== 'active' || !pilot.endsAt || !(Date.parse(pilot.endsAt) > Date.now())) throw new PrivateError('AI_DISABLED');
    if (!isIntentCurrent(this.view.snapshot, intent)) throw new PrivateError('CONFLICT');
    if (!hasCanonicalInputs(intent)) throw new PrivateError('CANONICAL_INPUT_INVALID');
    const inputKey = `${intent.trialId}:${intent.fingerprint}`;
    if (intent.jobId || this.attemptedPrivateInputs.has(inputKey)) throw new PrivateError('CASE_USED');
    if (pilot.blocked || pilot.reservedPln > 0 || pilot.sentCount >= pilot.maxSends || pilot.accountSentCount >= pilot.accountMaxSends
      || pilot.dailySentCount >= pilot.dailyMaxSends || this.view.visualizationAttempt?.status === 'unconfirmed'
      || visual.jobs.some(job => ['reserved', 'sent', 'outcome_unknown'].includes(job.status))
      || !Number.isFinite(intent.reservePln) || intent.reservePln <= 0 || intent.reservePln > pilot.availablePln) throw new PrivateError('TRIAL_BLOCKED');
    if (!this.attemptJournal) throw new PrivateError('ATTEMPT_STORAGE_UNAVAILABLE');
    this.attemptedPrivateInputs.add(inputKey);
    const receipt = { id: operationId, trialId: intent.trialId };
    this.patch({ visualizationAttempt: { ...receipt, status: 'sending' } });
    try {
      // Persist and read back before any generation POST. Logout keeps this
      // journal; re-login and a second device cannot silently retry an outcome.
      await this.attemptJournal.write(accountId, receipt); this.assertCurrent(generation);
      const job = await this.api.requestPrivateVisualization(operationId, intent, signal); this.assertCurrent(generation);
      if (job.id !== operationId) throw new PrivateError('INVALID_RESPONSE');
      this.replaceVisualization(job);
      this.patch({ visualizationAttempt: { ...receipt, status: 'accepted' } });
      await this.attemptJournal.remove(accountId, operationId); this.assertCurrent(generation);
      return job;
    } catch (error) {
      if (generation === this.generation) this.patch({ visualizationAttempt: { ...receipt, status: 'unconfirmed' } });
      throw error;
    }
  });

  revokeAiConsent = (expectedConsentRevision: number) => this.mutate(async (signal, generation) => {
    const consent = await this.api.revokeAiConsent(expectedConsentRevision, signal); this.assertCurrent(generation);
    const current = this.view.snapshot;
    if (current?.visualization) this.patch({ snapshot: { ...current, visualization: { ...current.visualization, consent,
      jobs: current.visualization.jobs.map(job => job.status === 'reserved' || job.status === 'sent' ? { ...job, result: null } : job) } } });
    return consent;
  });

  getVisualization = (jobId: string) => this.mutate(async (signal, generation) => {
    const job = await this.api.getVisualization(jobId, signal); this.assertCurrent(generation);
    if (job.id !== jobId) throw new PrivateError('INVALID_RESPONSE');
    this.replaceVisualization(job);
    if (this.view.visualizationAttempt?.id === jobId) {
      this.patch({ visualizationAttempt: { ...this.view.visualizationAttempt, status: 'accepted' } });
      await this.attemptJournal?.remove(this.view.identity!.id, jobId); this.assertCurrent(generation);
    }
    return job;
  });
  reviewVisualization = (jobId: string, expectedRevision: number, review: VisualizationReview) => this.mutate(async (signal, generation) => {
    if (['person', 'garments', 'completeness', 'artifacts', 'usefulness'].some(key => { const score = review.scores[key as keyof VisualizationReview['scores']]; return !Number.isInteger(score) || score < 0 || score > 2; }) || review.note.length > 1000) throw new PrivateError('INVALID_REVIEW');
    const job = await this.api.reviewVisualization(jobId, expectedRevision, review, signal); this.assertCurrent(generation);
    this.replaceVisualization(job); return job;
  });

  cancelVisualization = (jobId: string, expectedRevision: number) => this.mutate(async (signal, generation) => {
    const job = await this.api.cancelVisualization(jobId, expectedRevision, signal); this.assertCurrent(generation);
    const current = this.view.snapshot;
    if (current?.visualization) this.patch({ snapshot: { ...current, visualization: { ...current.visualization, jobs: current.visualization.jobs.map(existing => existing.id === job.id ? job : existing) } } });
    return job;
  });
  deleteVisualization = (jobId: string, expectedRevision: number) => this.mutate(async (signal, generation) => {
    const result = await this.api.deleteVisualization(jobId, expectedRevision, signal); this.assertCurrent(generation);
    this.clearPhotos();
    const current = this.view.snapshot;
    if (current?.visualization) this.patch({ snapshot: { ...current, visualization: { ...current.visualization, jobs: current.visualization.jobs.filter(job => job.id !== jobId) } } });
    const snapshot = await this.api.bootstrap(signal); this.assertCurrent(generation);
    this.patch({ snapshot }); return result;
  });
  deleteAiData = (expectedRevision: number) => this.mutate(async (signal, generation) => {
    const result = await this.api.deleteAiData(expectedRevision, signal); this.assertCurrent(generation);
    this.clearPhotos();
    const current = this.view.snapshot;
    if (current?.visualization) this.patch({ snapshot: { ...current, visualization: { ...current.visualization, jobs: [] } } });
    const snapshot = await this.api.bootstrap(signal); this.assertCurrent(generation);
    this.patch({ snapshot }); return result;
  });

  importP2 = (local: AppState, selectedProfileIds: string[], includeFeedback: boolean) => this.mutate(async (signal, generation) => {
    const snapshot = this.view.snapshot; if (!snapshot) throw new PrivateError('NOT_READY');
    const data = mergeP2Import(snapshot.state.data, local, selectedProfileIds, includeFeedback);
    const receipt = importReceiptId(snapshot.accountId, local, selectedProfileIds, includeFeedback);
    const state = await this.api.saveState(data, snapshot.state.revision, receipt, signal); this.assertCurrent(generation);
    this.patch({ snapshot: { ...snapshot, state } }); return state;
  });

  requestAccountDeletion = () => this.mutate(async (signal, generation) => {
    const accountId = this.view.identity!.id;
    const result = await this.api.deleteAccount(signal); this.assertCurrent(generation);
    this.clearPhotos(); this.patch({ snapshot: null, deletion: result });
    await this.attemptJournal?.clear(accountId); this.assertCurrent(generation); return result;
  });

  exportManifest = () => this.mutate(async (signal, generation) => {
    const result = await this.api.export(signal); this.assertCurrent(generation); return result;
  });
  dispose() { this.setIdentity(null); this.listeners.clear(); }
}
