import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { createWardrobeCall, WardrobeApi } from './api';
import { PrivateError } from './model';

export interface PublicSupabaseConfig { url: string; publishableKey: string }

export function getPublicSupabaseConfig(): PublicSupabaseConfig | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, '');
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !publishableKey) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && !(process.env.NODE_ENV === 'development' && ['localhost', '127.0.0.1'].includes(parsed.hostname))) return null;
    if (parsed.username || parsed.password || parsed.search || parsed.hash) return null;
    // Secret server keys must never be accepted by the public client.
    if (publishableKey.startsWith('sb_secret_')) return null;
    if (!publishableKey.startsWith('sb_publishable_')) {
      const payload = JSON.parse(atob(publishableKey.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as { role?: unknown };
      if (payload.role !== 'anon') return null;
    }
    return { url, publishableKey };
  } catch { return null; }
}

export interface PrivateServices { client: SupabaseClient; api: WardrobeApi; config: PublicSupabaseConfig; clearAuthStorage: () => Promise<void> }
let singleton: PrivateServices | null | undefined;

export function getPrivateServices(): PrivateServices | null {
  if (singleton !== undefined) return singleton;
  const config = getPublicSupabaseConfig();
  if (!config) { singleton = null; return null; }
  const storageKey = `ubranka:private:${new URL(config.url).host}:auth`;
  const client = createClient(config.url, config.publishableKey, {
    auth: {
      ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
      storageKey, persistSession: true, autoRefreshToken: true,
      flowType: 'pkce', detectSessionInUrl: false,
    },
  });
  const api = new WardrobeApi(createWardrobeCall({ ...config, accessToken: async () => {
    const { data, error } = await client.auth.getSession();
    if (error) throw new PrivateError('SESSION');
    return data.session?.access_token ?? null;
  } }));
  const clearAuthStorage = async () => {
    const keys = [storageKey, `${storageKey}-code-verifier`];
    if (Platform.OS === 'web') keys.forEach(key => window.localStorage.removeItem(key));
    else await AsyncStorage.multiRemove(keys);
  };
  singleton = { client, api, config, clearAuthStorage };
  return singleton;
}
