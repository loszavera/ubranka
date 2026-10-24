import { strToU8, zipSync } from 'fflate';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import type { ExportManifest } from './model';
import { PrivateError } from './model';

export async function downloadPrivateExport(manifest: ExportManifest, download: (path: string) => Promise<Uint8Array>, isCurrent: () => boolean): Promise<void> {
  const files: Record<string, Uint8Array> = { 'wardrobe.json': strToU8(JSON.stringify(manifest, null, 2)) };
  for (const item of manifest.items) {
    if (!isCurrent()) throw new PrivateError('SESSION_CHANGED');
    if (item.status !== 'active' || !item.photo) continue;
    // UUID-only archive names prevent metadata from creating archive traversal paths.
    if (!/^[\da-f-]{36}$/i.test(item.id)) throw new PrivateError('INVALID_RESPONSE');
    files[`photos/${item.id}.jpg`] = await download(item.photo.mainPath);
    files[`photos/${item.id}-thumbnail.jpg`] = await download(item.photo.thumbPath);
  }
  if (!isCurrent()) throw new PrivateError('SESSION_CHANGED');
  const bytes = zipSync(files, { level: 0 });
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([bytes.slice().buffer], { type: 'application/zip' }));
    try {
      const link = document.createElement('a'); link.href = url; link.download = 'ubranka-wardrobe.zip';
      document.body.appendChild(link); link.click(); link.remove();
    } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
    return;
  }
  if (!await Sharing.isAvailableAsync()) throw new PrivateError('EXPORT_UNAVAILABLE');
  const file = new File(Paths.cache, 'ubranka-wardrobe.zip');
  try {
    file.create({ overwrite: true }); file.write(bytes);
    if (!isCurrent()) throw new PrivateError('SESSION_CHANGED');
    await Sharing.shareAsync(file.uri, { mimeType: 'application/zip', dialogTitle: 'Ubranka' });
  } finally { if (file.exists) file.delete(); }
}
