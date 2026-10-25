import { Platform } from 'react-native';
import { bytesToBase64, PrivateError } from './model';
import type { PrivateServices } from './supabase';

export interface PhotoLease { uri: string; release: () => void }
export class PrivatePhotoAccess {
  private generation = 0;
  private urls = new Set<string>();
  private requests = new Set<AbortController>();
  constructor(private readonly services: PrivateServices) {}
  clear = () => {
    this.generation++;
    this.requests.forEach(request => request.abort()); this.requests.clear();
    if (Platform.OS === 'web') this.urls.forEach(url => URL.revokeObjectURL(url));
    this.urls.clear();
  };
  async download(path: string): Promise<Uint8Array> { return (await this.read(path)).bytes; }
  private async read(path: string): Promise<{ bytes: Uint8Array; mimeType: string }> {
    const generation = this.generation;
    const { data, error } = await this.services.client.auth.getSession();
    if (error || !data.session) throw new PrivateError('SIGNED_OUT');
    if (generation !== this.generation) throw new PrivateError('SESSION_CHANGED');
    // Paths come from the authenticated manifest and must stay under this owner.
    if (!path.startsWith(`${data.session.user.id}/`) || path.split('/').some(segment => segment === '..' || segment === '.')) throw new PrivateError('FORBIDDEN');
    const controller = new AbortController(); this.requests.add(controller);
    try {
      // POST rechecks current ownership before every read; direct Storage GETs
      // can outlive deletion in the provider CDN, even with a private bucket.
      const response = await fetch(`${this.services.config.url}/functions/v1/wardrobe`, {
        method: 'POST',
        headers: { apikey: this.services.config.publishableKey, Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'downloadPhoto', path }),
        cache: 'no-store', signal: controller.signal,
      });
      if (!response.ok) throw new PrivateError(response.status === 401 ? 'SIGNED_OUT' : 'PHOTO_UNAVAILABLE');
      const mimeType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
      if (mimeType !== 'image/jpeg' && mimeType !== 'image/png') throw new PrivateError('PHOTO_UNAVAILABLE');
      if (Number(response.headers.get('content-length')) > 8_388_608) throw new PrivateError('PHOTO_TOO_LARGE');
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (generation !== this.generation) throw new PrivateError('SESSION_CHANGED');
      if (!bytes.length || bytes.length > 8_388_608) throw new PrivateError('PHOTO_TOO_LARGE');
      return { bytes, mimeType };
    } finally { this.requests.delete(controller); }
  }
  async get(path: string): Promise<PhotoLease> {
    const generation = this.generation;
    const { bytes, mimeType } = await this.read(path);
    if (generation !== this.generation) throw new PrivateError('SESSION_CHANGED');
    if (Platform.OS !== 'web') return { uri: `data:${mimeType};base64,${bytesToBase64(bytes)}`, release: () => {} };
    const uri = URL.createObjectURL(new Blob([bytes.slice().buffer], { type: mimeType }));
    this.urls.add(uri);
    return { uri, release: () => { URL.revokeObjectURL(uri); this.urls.delete(uri); } };
  }
}
