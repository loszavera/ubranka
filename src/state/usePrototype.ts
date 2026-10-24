import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState as NativeAppState, Platform } from 'react-native';
import { addNetworkStateListener, getNetworkStateAsync, type NetworkState } from 'expo-network';
import type { AppState } from '../domain/model';
import { createInitialState, restoreState } from '../domain/state';

const STORAGE_KEY = 'ubranka:p2:v1';

export function usePrototype() {
  const [state, setState] = useState<AppState>(createInitialState);
  const [ready, setReady] = useState(false);
  const [storageIssue, setStorageIssue] = useState<'read'|'write'|'invalid'|null>(null);
  const writable = useRef(false);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const mounted = useRef(true);
  const latest = useRef(state);
  useEffect(() => { latest.current = state; }, [state]);

  const load = useCallback(() => AsyncStorage.getItem(STORAGE_KEY)
    .then(raw => {
      if (!mounted.current) return;
      const saved = raw === null ? createInitialState() : restoreState(raw);
      if (!saved) { writable.current = false; setStorageIssue('invalid'); }
      else { writable.current = true; setState(saved); setStorageIssue(null); }
    })
    .catch(() => { if (mounted.current) { writable.current = false; setStorageIssue('read'); } })
    .finally(() => { if (mounted.current) setReady(true); }), []);

  useEffect(() => { mounted.current = true; void load(); return () => { mounted.current = false; }; }, [load]);
  useEffect(() => {
    if (!ready || !writable.current) return;
    // Serialize writes so an older slow write cannot overwrite newer preferences.
    const serialized = JSON.stringify(state);
    queue.current = queue.current.then(async () => {
      try { await AsyncStorage.setItem(STORAGE_KEY, serialized); if (mounted.current) setStorageIssue(null); }
      catch { if (mounted.current) setStorageIssue('write'); }
    });
  }, [state, ready]);

  const retry = async () => {
    if (!writable.current) { await load(); return; }
    queue.current = queue.current.then(async () => {
      try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(latest.current)); setStorageIssue(null); }
      catch { setStorageIssue('write'); }
    });
    await queue.current;
  };
  const reset = async () => {
    await queue.current;
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      writable.current = true; setStorageIssue(null); setState(createInitialState());
    } catch { setStorageIssue(writable.current ? 'write' : 'read'); }
  };
  return { state, setState, ready, storageIssue, retry, reset };
}

export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    if (Platform.OS !== 'web') {
      let active = true;
      const apply = (network: NetworkState) => {
        if (active) setOnline(network.isConnected !== false && network.isInternetReachable !== false);
      };
      const refresh = () => { void getNetworkStateAsync().then(apply).catch(() => { /* Unknown is not proof of being offline. */ }); };
      const subscription = addNetworkStateListener(apply);
      const foreground = NativeAppState.addEventListener('change', status => { if (status === 'active') refresh(); });
      refresh();
      return () => { active = false; subscription.remove(); foreground.remove(); };
    }
    if (typeof window === 'undefined') return;
    const update = () => setOnline(window.navigator.onLine);
    update(); window.addEventListener('online', update); window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  return online;
}
