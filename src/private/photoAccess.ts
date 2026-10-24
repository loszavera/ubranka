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
  async download(path: string): Promise<Uint8Array> {
    const generation = this.generation;
    const { data, error } = await this.services.client.auth.getSession();
    if (error || !data.session) throw new PrivateError('SIGNED_OUT');
    if (generation !== this.generation) throw new PrivateError('SESSION_CHANGED');
    // Paths come from the authenticated manifest and must stay under this owner.
    if (!path.startsWith(`${data.session.user.id}/`) || path.split('/').some(segment => segment === '..' || segment === '.')) throw new PrivateError('FORBIDDEN');
    const controller = new AbortController(); this.requests.add(controller);
    try {
      const response = await fetch(`${this.services.config.url}/storage/v1/object/authenticated/wardrobe-private/${path.split('/').map(encodeURIComponent).join('/')}`, {
        headers: { apikey: this.services.config.publishableKey, Authorization: `Bearer ${data.session.access_token}` },
        cache: 'no-store', signal: controller.signal,
      });
      if (!response.ok) throw new PrivateError(response.status === 401 ? 'SIGNED_OUT' : 'PHOTO_UNAVAILABLE');
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (generation !== this.generation) throw new PrivateError('SESSION_CHANGED');
      return bytes;
    } finally { this.requests.delete(controller); }
  }
  async get(path: string): Promise<PhotoLease> {
    const generation = this.generation;
    const bytes = await this.download(path);
    if (generation !== this.generation) throw new PrivateError('SESSION_CHANGED');
    if (Platform.OS !== 'web') return { uri: `data:image/jpeg;base64,${bytesToBase64(bytes)}`, release: () => {} };
    const uri = URL.createObjectURL(new Blob([bytes.slice().buffer], { type: 'image/jpeg' }));
    this.urls.add(uri);
    return { uri, release: () => { URL.revokeObjectURL(uri); this.urls.delete(uri); } };
  }
}
