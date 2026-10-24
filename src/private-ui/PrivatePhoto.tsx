import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import type { Locale } from '../domain/model';
import type { usePrivateWardrobe } from '../private/usePrivateWardrobe';
import { colors } from '../ui/theme';
import { privateCopy } from './copy';

export function PrivatePhoto({ path, api, locale, label, height = 260 }: { path: string; api: ReturnType<typeof usePrivateWardrobe>; locale: Locale; label?: string; height?: number }) {
  const getPhoto = api.getPhoto;
  const [result, setResult] = useState<{ path: string; loader: typeof getPhoto; uri?: string; error?: boolean }>();
  const current = result?.path === path && result.loader === getPhoto ? result : undefined;
  useEffect(() => {
    let active = true; let release: (() => void) | undefined;
    void getPhoto(path).then(photo => {
      if (!active) { photo.release(); return; }
      release = photo.release; setResult({ path, loader: getPhoto, uri: photo.uri });
    }).catch(() => { if (active) setResult({ path, loader: getPhoto, error: true }); });
    return () => { active = false; release?.(); };
  }, [path, getPhoto]);
  return <View style={[s.photo, { height }]}>{current?.uri ? <Image source={{ uri: current.uri }} style={s.image} resizeMode="contain" accessibilityLabel={label ?? privateCopy(locale).photo} />
    : current?.error ? <Text style={s.note}>{privateCopy(locale).photoFailure}</Text> : <ActivityIndicator color={colors.plum} />}</View>;
}
const s = StyleSheet.create({ photo: { borderRadius: 16, backgroundColor: colors.faint, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, image: { width: '100%', height: '100%' }, note: { color: colors.muted, fontSize: 12 } });
