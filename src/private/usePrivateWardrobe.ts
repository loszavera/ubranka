import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { AppState as NativeAppState, Platform } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { randomUUID } from 'expo-crypto';
import type { Session } from '@supabase/supabase-js';
import { asPrivateError, WardrobeApi, type DeleteResult } from './api';
import { PrivateError, type VisualizationIntent } from './model';
import { isIntentCurrent } from './visualization';
import { PrivatePhotoAccess, type PhotoReadOptions } from './photoAccess';
import { getPrivateServices } from './supabase';
import { PrivateStore } from './store';
import { downloadPrivateExport, downloadPrivateFile } from './export';
import { createAttemptJournal } from './attemptReceiptStorage';

export const newPrivateId = () => randomUUID();
WebBrowser.maybeCompleteAuthSession();

export function usePrivateWardrobe() {
  const services = useMemo(() => getPrivateServices(), []);
  const photos = useMemo(() => services ? new PrivatePhotoAccess(services) : null, [services]);
  const attemptJournal = useMemo(() => services ? createAttemptJournal(services.config.url) : undefined, [services]);
  const store = useMemo(() => new PrivateStore(services?.api ?? new WardrobeApi(async () => { throw new PrivateError('NOT_CONFIGURED'); }), newPrivateId, photos?.clear, attemptJournal), [services, photos, attemptJournal]);
  const view = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [authLoading, setAuthLoading] = useState(Boolean(services));
  const [authError, setAuthError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [accountDeletion, setAccountDeletion] = useState<DeleteResult | null>(null);
  const authSuspended = useRef(false);

  useEffect(() => {
    if (!services) return;
    let mounted = true; let authVersion = 0;
    const accept = (session: Session | null) => {
      if (!mounted || authSuspended.current) return;
      authVersion++;
      store.setIdentity(session ? { id: session.user.id, email: session.user.email ?? '' } : null);
      setAuthLoading(false);
      if (session) queueMicrotask(() => { if (mounted) void store.refresh(); });
    };
    const { data: { subscription } } = services.client.auth.onAuthStateChange((_event, session) => accept(session));
    const initialize = async () => {
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          const code = url.searchParams.get('code'); const oauthError = url.searchParams.get('error');
          if (code || oauthError) {
            for (const key of ['code', 'error', 'error_description', 'error_code']) url.searchParams.delete(key);
            window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
            if (oauthError) throw new PrivateError('AUTH_DENIED');
            if (code) {
              const { error } = await services.client.auth.exchangeCodeForSession(code);
              if (error) throw new PrivateError('AUTH_CALLBACK');
            }
          }
        }
        const before = authVersion;
        const { data, error } = await services.client.auth.getSession();
        if (error) throw new PrivateError('SESSION');
        if (mounted && before === authVersion) accept(data.session);
      } catch (error) {
        if (mounted) { setAuthError(asPrivateError(error).code); setAuthLoading(false); }
      }
    };
    void initialize();
    const native = NativeAppState.addEventListener('change', state => {
      if (state === 'active') { if (Platform.OS !== 'web') services.client.auth.startAutoRefresh(); void store.refresh(); }
      else if (Platform.OS !== 'web') services.client.auth.stopAutoRefresh();
    });
    const refresh = () => { if (document.visibilityState === 'visible') void store.refresh(); };
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', refresh); window.addEventListener('online', refresh);
    }
    // Small pilot: pull latest server state while foregrounded. Saves still use
    // the revision captured by the form, so this never silently merges edits.
    const interval = setInterval(() => {
      if (Platform.OS === 'web' ? typeof document !== 'undefined' && document.visibilityState === 'visible' : NativeAppState.currentState === 'active') void store.refresh();
    }, 30_000);
    return () => {
      mounted = false; subscription.unsubscribe(); native.remove(); clearInterval(interval);
      if (Platform.OS === 'web' && typeof window !== 'undefined') { document.removeEventListener('visibilitychange', refresh); window.removeEventListener('online', refresh); }
      store.dispose();
    };
  }, [services, store]);

  const signIn = useCallback(async () => {
    if (!services) throw new PrivateError('NOT_CONFIGURED');
    authSuspended.current = false;
    setAuthError(null); setAccountDeletion(null);
    try {
      if (Platform.OS !== 'web' && Constants.appOwnership === 'expo') throw new PrivateError('DEVELOPMENT_BUILD_REQUIRED');
      const redirectTo = Platform.OS === 'web' ? `${window.location.origin}/?wardrobe=1` : makeRedirectUri({ scheme: 'ubranka' });
      const { data, error } = await services.client.auth.signInWithOAuth({ provider: 'google', options: {
        redirectTo, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' },
      } });
      if (error || !data.url) throw new PrivateError('AUTH_UNAVAILABLE');
      if (Platform.OS === 'web') { window.location.assign(data.url); return; }
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success') return;
      const callback = new URL(result.url); const expected = new URL(redirectTo);
      if (callback.protocol !== expected.protocol || callback.hostname !== expected.hostname || callback.pathname !== expected.pathname) throw new PrivateError('AUTH_CALLBACK');
      const code = callback.searchParams.get('code'); if (!code) throw new PrivateError('AUTH_CALLBACK');
      const exchange = await services.client.auth.exchangeCodeForSession(code);
      if (exchange.error) throw new PrivateError('AUTH_CALLBACK');
    } catch (error) { const safe = asPrivateError(error); setAuthError(safe.code); throw safe; }
  }, [services]);

  const signOut = useCallback(async () => {
    authSuspended.current = true;
    store.setIdentity(null); photos?.clear(); setAuthError(null);
    if (!services) return;
    try {
      const { error } = await services.client.auth.signOut({ scope: 'local' });
      // Also clear storage if revoking a remote session fails. A failed network
      // request must not make this device reopen the previous private account.
      await services.clearAuthStorage();
      if (error) throw new PrivateError('SIGN_OUT_FAILED');
    } catch {
      try { await services.clearAuthStorage(); } catch { /* UI reports failure and stays cleared. */ }
      setAuthError('SIGN_OUT_FAILED'); throw new PrivateError('SIGN_OUT_FAILED');
    }
  }, [services, store, photos]);

  const deleteAccount = useCallback(async () => {
    const result = await store.requestAccountDeletion(); setAccountDeletion(result);
    await signOut(); return result;
  }, [store, signOut]);

  const getPhoto = useCallback((path: string, options?: PhotoReadOptions) => {
    if (!photos || !view.identity || !view.snapshot || !store.getSnapshot().identity) return Promise.reject(new PrivateError('SIGNED_OUT'));
    return photos.get(path, options);
    // Identity/snapshot changes invalidate leases, so consumers reload on this callback.
  }, [photos, store, view.identity, view.snapshot]);

  const exportData = useCallback(async () => {
    if (!photos || exporting) throw new PrivateError(exporting ? 'BUSY' : 'NOT_CONFIGURED');
    const identity = store.getSnapshot().identity;
    if (!identity) throw new PrivateError('SIGNED_OUT');
    setExporting(true); setAuthError(null);
    try {
      const manifest = await store.exportManifest();
      await downloadPrivateExport(manifest, (path, options) => photos.download(path, options), () => store.getSnapshot().identity === identity);
    } catch (error) { const safe = asPrivateError(error); setAuthError(safe.code); throw safe; }
    finally { setExporting(false); }
  }, [photos, store, exporting]);

  const getCanonicalPhoto = useCallback((intent: VisualizationIntent, input: VisualizationIntent['inputs'][number], signal?: AbortSignal) => {
    const current = store.getSnapshot();
    if (!photos || !view.identity || !view.snapshot || !current.identity || !isIntentCurrent(current.snapshot, intent)) return Promise.reject(new PrivateError('CONFLICT'));
    return photos.getCanonical(intent, input, signal);
  }, [photos, store, view.identity, view.snapshot]);

  const downloadVisualization = useCallback(async (jobId: string) => {
    if (!photos || exporting) throw new PrivateError(exporting ? 'BUSY' : 'NOT_CONFIGURED');
    const identity = store.getSnapshot().identity;
    const job = store.getSnapshot().snapshot?.visualization?.jobs.find(value => value.id === jobId);
    if (!identity || !job?.result || job.status !== 'succeeded' || !(Date.parse(job.expiresAt) > Date.now())) throw new PrivateError('RESULT_UNAVAILABLE');
    const result = job.result;
    const isCurrent = () => store.getSnapshot().identity === identity && store.getSnapshot().snapshot?.visualization?.jobs.some(value => value.id === jobId && value.result?.mainPath === result.mainPath && value.result?.thumbPath === result.thumbPath && value.status === 'succeeded' && Date.parse(value.expiresAt) > Date.now()) === true;
    setExporting(true); setAuthError(null);
    try { await downloadPrivateFile(await photos.download(result.mainPath, { mimeType: result.mimeType, maxBytes: 8_000_000 }), result.mimeType, result.mimeType === 'image/png' ? 'ubranka-visualization.png' : 'ubranka-visualization.jpg', isCurrent); }
    catch (error) { const safe = asPrivateError(error); setAuthError(safe.code); throw safe; }
    finally { setExporting(false); }
  }, [photos, store, exporting]);

  return {
    configured: Boolean(services), status: !services ? 'unconfigured' as const : authLoading || view.loading ? 'loading' as const
      : !view.identity ? 'signed-out' as const : view.snapshot ? 'ready' as const : 'error' as const,
    identity: view.identity, snapshot: view.snapshot, busy: view.busy || exporting,
    error: authError ?? view.error, conflict: view.error === 'CONFLICT', deletion: accountDeletion ?? view.deletion,
    pendingSave: view.pendingSave,
    visualizationAttempt: view.visualizationAttempt,
    signIn, signOut, refresh: () => { store.clearError(); return store.refresh(); }, clearError: () => { setAuthError(null); store.clearError(); },
    saveSettings: store.saveSettings, saveItem: store.saveItem, deleteItem: store.deleteItem, deletePhoto: store.deletePhoto,
    saveBodyFit: store.saveBodyFit, uploadBodyPhoto: store.uploadBodyPhoto, deleteBodyPhoto: store.deleteBodyPhoto, saveStyling: store.saveStyling,
    cancelVisualization: store.cancelVisualization, deleteVisualization: store.deleteVisualization, deleteAiData: store.deleteAiData,
    requestVisualization: store.requestVisualization, getVisualization: store.getVisualization, reviewVisualization: store.reviewVisualization,
    prepareVisualization: store.prepareVisualization, requestPrivateVisualization: store.requestPrivateVisualization, revokeAiConsent: store.revokeAiConsent,
    deleteAccount, importP2: store.importP2, getPhoto, getCanonicalPhoto, exportData, downloadVisualization,
  };
}
