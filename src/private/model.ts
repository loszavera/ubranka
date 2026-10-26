import type { AppState, Feedback, Locale, Occasion, Profile } from '../domain/model.ts';
import { OCCASIONS } from '../domain/model.ts';
import type { SavedPrivateOutfit, PrivateOutfitFeedback } from './outfits.ts';

export const PRIVATE_CATEGORIES = ['top', 'bottom', 'layer', 'shoes', 'dress', 'accessory'] as const;
export type PrivateCategory = typeof PRIVATE_CATEGORIES[number];
export type PhotoKind = 'garment' | 'person';

export interface PrivateSettings {
  locale: Locale;
  profiles: Profile[];
  activeProfileId: string;
  feedback: Feedback[];
  askReason: boolean;
}
export interface CloudState { revision: number; data: PrivateSettings }
export interface PrivatePhoto {
  id: string;
  mainPath: string;
  thumbPath: string;
  mimeType: string;
  bytes: number;
  thumbBytes: number;
}
export interface ItemFields {
  name: string;
  category: PrivateCategory;
  color: string;
  occasions: Occasion[];
  size: string;
  photoKind: PhotoKind;
}
export interface PrivateItem extends ItemFields {
  id: string;
  revision: number;
  status: 'active' | 'deleting';
  photo: PrivatePhoto | null;
  createdAt: string;
  updatedAt: string;
}
export interface BodyFitData {
  heightCm: number | null; chestCm: number | null; waistCm: number | null; hipsCm: number | null;
  sizeSystem: 'EU' | 'UK' | 'US' | 'other'; topSize: string; bottomSize: string; shoeSize: string;
}
export interface BodyFit { revision: number; data: BodyFitData; photo: PrivatePhoto | null; photoDeletion: 'pending' | null }
export interface StylingData { outfits: SavedPrivateOutfit[]; feedback: PrivateOutfitFeedback[] }
export interface StylingState { revision: number; data: StylingData }
export type VisualizationStatus = 'reserved' | 'sent' | 'succeeded' | 'failed' | 'outcome_unknown' | 'cancelled' | 'expired';
export interface VisualizationReview {
  scores: { person: number; garments: number; completeness: number; artifacts: number; usefulness: number };
  criticalError: boolean; note: string;
}
export interface VisualizationResult {
  mainPath: string; thumbPath: string; bytes: number; thumbBytes: number; mimeType: string; thumbMimeType?: string; expiresAt?: string;
  bucket?: string; width?: number; height?: number; thumbWidth?: number; thumbHeight?: number;
}
export interface AiConsent { accepted: boolean; version: string; revision?: number }
export interface PrivatePilot {
  id: string; status: 'prepared' | 'active' | 'closed'; eligible: boolean; startsAt: string | null; endsAt: string | null;
  maxSends: number; accountMaxSends: number; dailyMaxSends: number; sentCount: number; accountSentCount: number; dailySentCount: number;
  budgetPln: number; spentPln: number; reservedPln: number; availablePln: number; blocked: boolean;
}
export interface VisualizationIntent {
  id: string; trialId: string; outfitId: string; fingerprint: string; bodyRevision: number; stylingRevision: number;
  consentRevision: number; expiresAt: string; reservePln: number; jobId: string | null; manifestHash?: string;
  inputs: { photoId: string; path: string; thumbPath: string; bytes: number; kind: 'body' | 'item'; itemId?: string | null; canonical?: CanonicalInput }[];
}
export interface CanonicalInput { version: string; sha256: string; bytes: number; width: number; height: number }
export const PRIVATE_AI_CONSENT = 'p33c-ai-v1.2';
export interface SyntheticCase {
  id: string; label: string; personPath: string; itemPaths: string[]; reservePln: number; model: string; promptVersion: string;
  jobId: string | null; sent: boolean;
}
export interface SyntheticTrial {
  id: string; endsAt: string | null; budgetPln: number; spentPln: number; reservedPln: number; maxSends: number; sentCount: number;
  blocked: boolean; cases: SyntheticCase[];
}
export interface VisualizationJob {
  id: string; revision: number; outfitId: string; status: VisualizationStatus; createdAt: string; completedAt: string | null;
  expiresAt: string; errorCode: string | null; reservedPln: number; spentPln: number | null; result: VisualizationResult | null;
  review?: VisualizationReview | null;
  trialId?: string; intentId?: string;
}
export interface VisualizationState {
  mode: 'off' | 'synthetic_trial' | 'private_pilot'; jobs: VisualizationJob[]; consent: AiConsent; trial?: SyntheticTrial | null; pilot?: PrivatePilot | null;
  monthlyBudget?: { budgetPln: number; spentPln: number; reservedPln: number; availablePln: number; resetsAt: string };
  limits: { results: number; attempts: number; dailyAttempts: number; usedResults: number; usedAttempts: number; usedDailyAttempts: number;
    reservedPln: number; spentPln: number; budgetPln: number; trialEndsAt: string | null; monthResetsAt: string; dayResetsAt: string };
}
export interface PrivateSnapshot { accountId: string; state: CloudState; items: PrivateItem[]; bodyFit?: BodyFit; styling?: StylingState; visualization?: VisualizationState }
export interface ExportManifest { exportedAt: string; state: CloudState; items: PrivateItem[]; bodyFit?: BodyFit; styling?: StylingState; visualization?: VisualizationState }
export interface SaveItemInput extends ItemFields { id: string; expectedRevision?: number }
export interface PrivateIdentity { id: string; email: string }

export class PrivateError extends Error {
  readonly code: string;
  constructor(code: string) { super(code); this.name = 'PrivateError'; this.code = code; }
}

export const BODY_STORAGE_CONSENT = 'p33a-body-v1';
export function emptyBodyFitData(): BodyFitData {
  return { heightCm: null, chestCm: null, waistCm: null, hipsCm: null, sizeSystem: 'EU', topSize: '', bottomSize: '', shoeSize: '' };
}
export function normalizeBodyFitData(data: BodyFitData): BodyFitData {
  for (const key of ['heightCm', 'chestCm', 'waistCm', 'hipsCm'] as const) {
    const value = data[key];
    if (value !== null && (!Number.isFinite(value) || value <= 0 || value > 300 || Number(value.toFixed(1)) !== value)) throw new PrivateError('INVALID_BODY_FIT');
  }
  if (!['EU', 'UK', 'US', 'other'].includes(data.sizeSystem)) throw new PrivateError('INVALID_BODY_FIT');
  for (const key of ['topSize', 'bottomSize', 'shoeSize'] as const) if (typeof data[key] !== 'string' || data[key].trim().length > 30) throw new PrivateError('INVALID_BODY_FIT');
  return { ...data, topSize: data.topSize.trim(), bottomSize: data.bottomSize.trim(), shoeSize: data.shoeSize.trim() };
}

export function emptyPrivateSettings(): PrivateSettings {
  return { locale: 'pl', profiles: [], activeProfileId: '', feedback: [], askReason: true };
}

export function normalizeItemFields(input: ItemFields): ItemFields {
  if (!PRIVATE_CATEGORIES.includes(input.category) || !['garment', 'person'].includes(input.photoKind)
    || !Array.isArray(input.occasions) || input.occasions.length === 0
    || input.occasions.some(occasion => !OCCASIONS.includes(occasion))) throw new PrivateError('INVALID_INPUT');
  const name = input.name.trim(); const color = input.color.trim(); const size = input.size.trim();
  if (!name || name.length > 100 || !color || color.length > 50 || size.length > 30) throw new PrivateError('INVALID_INPUT');
  return { name, color, size, category: input.category, photoKind: input.photoKind, occasions: [...new Set(input.occasions)] };
}

// Copy only explicit preferences. Demo ownership never becomes the real wardrobe.
// Namespaced IDs make imports from the same local profile repeatable without
// overwriting independently created cloud profiles or existing feedback.
export function mergeP2Import(current: PrivateSettings, local: AppState, selectedIds: string[], includeFeedback: boolean): PrivateSettings {
  const selected = new Set(selectedIds);
  const imports = local.profiles.filter(profile => selected.has(profile.id));
  if (imports.length === 0) throw new PrivateError('EMPTY_IMPORT');
  const profiles = current.profiles.map(profile => ({ ...profile }));
  const feedback = current.feedback.map(entry => ({ ...entry }));
  for (const profile of imports) {
    const id = `p2:${profile.id}`;
    if (!profiles.some(existing => existing.id === id)) profiles.push({ ...profile, id });
    if (includeFeedback) {
      for (const entry of local.feedback.filter(value => value.profileId === profile.id)) {
        if (!feedback.some(existing => existing.profileId === id && existing.outfitId === entry.outfitId)) feedback.push({ ...entry, profileId: id });
      }
    }
  }
  return { ...current, profiles, feedback, activeProfileId: current.activeProfileId || profiles[0].id };
}

// UUIDv5-like deterministic receipt key. Not a security primitive; it only binds
// a user's import selection and snapshot to a repeatable idempotency receipt.
export function importReceiptId(accountId: string, local: AppState, selectedIds: string[], includeFeedback: boolean): string {
  const ids = [...new Set(selectedIds)].sort();
  const selected = local.profiles.filter(profile => ids.includes(profile.id)).sort((a, b) => a.id.localeCompare(b.id));
  const feedback = includeFeedback ? local.feedback.filter(entry => ids.includes(entry.profileId)) : [];
  const text = JSON.stringify([accountId, selected, feedback, includeFeedback]);
  const words = [0x811c9dc5, 0x9e3779b9, 0x85ebca6b, 0xc2b2ae35];
  for (let i = 0; i < text.length; i++) for (let j = 0; j < words.length; j++) words[j] = Math.imul(words[j] ^ (text.charCodeAt(i) + j), 0x01000193) >>> 0;
  const raw = words.map(word => word.toString(16).padStart(8, '0')).join('');
  return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-5${raw.slice(13, 16)}-a${raw.slice(17, 20)}-${raw.slice(20)}`;
}

export function bytesToBase64(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += 3) {
    const value = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    parts.push(alphabet[(value >>> 18) & 63] + alphabet[(value >>> 12) & 63]
      + (i + 1 < bytes.length ? alphabet[(value >>> 6) & 63] : '=') + (i + 2 < bytes.length ? alphabet[value & 63] : '='));
  }
  return parts.join('');
}
