import { PrivateError } from './model.ts';

export type AttemptReceipt = { id: string; caseId: string; trialId?: never } | { id: string; trialId: string; caseId?: never };
export interface AttemptReceiptJournal {
  read(accountId: string): Promise<AttemptReceipt[]>;
  write(accountId: string, receipt: AttemptReceipt): Promise<void>;
  remove(accountId: string, id: string): Promise<void>;
  clear(accountId: string): Promise<void>;
}
export interface AttemptReceiptStorage {
  get(accountId: string): Promise<string | null>;
  set(accountId: string, text: string): Promise<void>;
  delete(accountId: string): Promise<void>;
}
const uuid = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
function parse(raw: string | null): AttemptReceipt[] {
  if (raw === null) return [];
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object' || !('version' in value) || (value.version !== 1 && value.version !== 2) || !('receipts' in value) || !Array.isArray(value.receipts) || value.receipts.length > 66) throw new Error('Invalid receipt');
  return value.receipts.map(receipt => {
    if (!receipt || typeof receipt !== 'object' || typeof receipt.id !== 'string' || !uuid.test(receipt.id)) throw new Error('Invalid receipt');
    if (typeof receipt.caseId === 'string' && /^B0[1-6]$/.test(receipt.caseId) && !receipt.trialId) return { id: receipt.id, caseId: receipt.caseId };
    if (value.version === 2 && typeof receipt.trialId === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(receipt.trialId) && !receipt.caseId) return { id: receipt.id, trialId: receipt.trialId };
    throw new Error('Invalid receipt');
  });
}

// This journal contains only random operation IDs and registered case IDs. It
// never stores images, profiles, prompts, consent text, tokens or a job snapshot.
export class PrivateAttemptJournal implements AttemptReceiptJournal {
  private queue: Promise<void> = Promise.resolve();
  private readonly storage: AttemptReceiptStorage;
  constructor(storage: AttemptReceiptStorage) { this.storage = storage; }
  private run<T>(accountId: string, work: () => Promise<T>): Promise<T> {
    const task = this.queue.then(async () => {
      if (!uuid.test(accountId)) throw new PrivateError('ATTEMPT_STORAGE_UNAVAILABLE');
      try { return await work(); } catch { throw new PrivateError('ATTEMPT_STORAGE_UNAVAILABLE'); }
    });
    this.queue = task.then(() => {}, () => {}); return task;
  }
  read(accountId: string) { return this.run(accountId, async () => parse(await this.storage.get(accountId))); }
  write(accountId: string, receipt: AttemptReceipt) {
    return this.run(accountId, async () => {
      const receipts = parse(await this.storage.get(accountId));
      const existing = receipts.find(value => receipt.trialId ? value.trialId === receipt.trialId : value.caseId === receipt.caseId);
      if (existing && existing.id !== receipt.id) throw new Error('Case already attempted');
      const next = existing ? receipts : [...receipts, receipt];
      const text = JSON.stringify({ version: next.some(value => value.trialId) ? 2 : 1, receipts: next }); parse(text);
      await this.storage.set(accountId, text);
      if (await this.storage.get(accountId) !== text) throw new Error('Receipt write not confirmed');
    });
  }
  remove(accountId: string, id: string) {
    return this.run(accountId, async () => {
      const next = parse(await this.storage.get(accountId)).filter(receipt => receipt.id !== id);
      if (next.length) await this.storage.set(accountId, JSON.stringify({ version: next.some(value => value.trialId) ? 2 : 1, receipts: next }));
      else await this.storage.delete(accountId);
    });
  }
  clear(accountId: string) { return this.run(accountId, () => this.storage.delete(accountId)); }
}
