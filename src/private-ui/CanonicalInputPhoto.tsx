import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import type { Locale } from '../domain/model';
import type { VisualizationIntent } from '../private/model';
import type { usePrivateWardrobe } from '../private/usePrivateWardrobe';
import { colors } from '../ui/theme';
import { p33cCopy } from './p33ccopy';

/** Display only a verified server copy. There is no fallback to the wardrobe original. */
export function CanonicalInputPhoto({ intent, input, api, locale, label, onReady }: {
  intent: VisualizationIntent; input: VisualizationIntent['inputs'][number]; api: ReturnType<typeof usePrivateWardrobe>;
  locale: Locale; label: string; onReady: (photoId: string, ready: boolean) => void;
}) {
  const getPhoto = api.getCanonicalPhoto;
  const [result, setResult] = useState<{ loader: typeof getPhoto; uri?: string; error?: boolean }>();
  const current = result?.loader === getPhoto ? result : undefined;
  useEffect(() => {
    let active = true; let release: (() => void) | undefined;
    const controller = new AbortController(); onReady(input.photoId, false);
    void getPhoto(intent, input, controller.signal).then(photo => {
      if (!active) { photo.release(); return; }
      release = photo.release; setResult({ loader: getPhoto, uri: photo.uri });
    }).catch(() => { if (active) setResult({ loader: getPhoto, error: true }); });
    return () => { active = false; controller.abort(); release?.(); onReady(input.photoId, false); };
  }, [getPhoto, intent, input, onReady]);
  return <View style={s.photo}>
    {current?.uri ? <Image source={{ uri: current.uri }} style={s.image} resizeMode="contain" accessibilityLabel={label}
      onLoad={() => onReady(input.photoId, true)}
      onError={() => { onReady(input.photoId, false); setResult({ loader: getPhoto, error: true }); }} />
      : current?.error ? <Text style={s.error} accessibilityRole="alert">{p33cCopy(locale).copyFailure}</Text> : <ActivityIndicator color={colors.plum} />}
  </View>;
}
const s = StyleSheet.create({
  photo: { height: 300, borderRadius: 16, backgroundColor: colors.faint, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { width: '100%', height: '100%' }, error: { color: colors.error, fontSize: 14, padding: 16 },
});
