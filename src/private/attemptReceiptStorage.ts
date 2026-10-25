import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { PrivateAttemptJournal } from './attemptReceipt';

export function createAttemptJournal(projectUrl: string): PrivateAttemptJournal {
  const project = encodeURIComponent(new URL(projectUrl).host);
  const key = (accountId: string) => `ubranka:private:${project}:trial-receipts:${accountId}`;
  const file = (accountId: string) => new File(Paths.document, `ubranka-trial-${project}-${accountId}.json`);
  return new PrivateAttemptJournal({
    get: async accountId => {
      if (Platform.OS === 'web') return window.localStorage.getItem(key(accountId));
      const value = file(accountId); return value.exists ? value.text() : null;
    },
    set: async (accountId, text) => {
      if (Platform.OS === 'web') { window.localStorage.setItem(key(accountId), text); return; }
      const value = file(accountId); value.create({ overwrite: true }); value.write(text);
    },
    delete: async accountId => {
      if (Platform.OS === 'web') { window.localStorage.removeItem(key(accountId)); return; }
      const value = file(accountId); if (value.exists) value.delete();
    },
  });
}
