import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { Locale } from '../domain/model';
import type { usePrivateWardrobe } from '../private/usePrivateWardrobe';
import { colors } from '../ui/theme';
import { privateCopy } from './copy';

export function PrivatePhoto({ path, api, locale, label, height = 260, width, mimeType, maxBytes, lazy = false, onReady }: { path: string; api: ReturnType<typeof usePrivateWardrobe>; locale: Locale; label?: string; height?: number; width?: number; mimeType?: string; maxBytes?: number; lazy?: boolean; onReady?: (path: string) => void }) {
  const getPhoto = api.getPhoto;
  const container = useRef<View>(null); const windowSize = useWindowDimensions();
  const [visible, setVisible] = useState(!lazy);
  useEffect(() => {
    if (!lazy) return;
    if (Platform.OS === 'web' && typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(entries => setVisible(entries[0]?.isIntersecting ?? false), { rootMargin: '80px' });
      if (container.current) observer.observe(container.current as unknown as Element);
      return () => observer.disconnect();
    }
    // Native View measurement also works inside the existing parent ScrollView;
    // avoid an unbounded nested FlatList or eagerly fetching every original.
    let mounted = true;
    const measure = () => container.current?.measureInWindow((x, y, w, h) => { if (mounted) setVisible(w > 0 && h > 0 && y + h > -80 && y < windowSize.height + 80 && x + w > 0); });
    measure(); const timer = setInterval(measure, 400);
    return () => { mounted = false; clearInterval(timer); };
  }, [lazy, windowSize.height]);
  return <View ref={container} collapsable={false} style={[s.photo, { height }, width === undefined ? null : { width }]}>
    {visible ? <PhotoContent path={path} getPhoto={getPhoto} locale={locale} label={label} mimeType={mimeType} maxBytes={maxBytes} onReady={onReady} /> : null}
  </View>;
}

// Leaving the viewport unmounts the content as well as aborting the request.
// Native data-URI bytes are not retained in offscreen component state, and a
// revoked web Blob URL is never rendered again when the user scrolls back.
function PhotoContent({ path, getPhoto, locale, label, mimeType, maxBytes, onReady }: { path: string; getPhoto: ReturnType<typeof usePrivateWardrobe>['getPhoto']; locale: Locale; label?: string; mimeType?: string; maxBytes?: number; onReady?: (path: string) => void }) {
  const [result, setResult] = useState<{ path: string; loader: typeof getPhoto; uri?: string; error?: boolean }>();
  const current = result?.path === path && result.loader === getPhoto ? result : undefined;
  useEffect(() => {
    let active = true; let release: (() => void) | undefined;
    const controller = new AbortController();
    void getPhoto(path, { signal: controller.signal, mimeType, maxBytes }).then(photo => {
      if (!active) { photo.release(); return; }
      release = photo.release; setResult({ path, loader: getPhoto, uri: photo.uri });
    }).catch(() => { if (active) setResult({ path, loader: getPhoto, error: true }); });
    return () => { active = false; controller.abort(); release?.(); };
  }, [path, getPhoto, mimeType, maxBytes]);
  return current?.uri ? <Image source={{ uri: current.uri }} style={s.image} resizeMode="contain" accessibilityLabel={label ?? privateCopy(locale).photo} onLoad={() => onReady?.(path)} onError={() => setResult({ path, loader: getPhoto, error: true })} />
    : current?.error ? <Text style={s.note}>{privateCopy(locale).photoFailure}</Text> : <ActivityIndicator color={colors.plum} />;
}
const s = StyleSheet.create({ photo: { borderRadius: 16, backgroundColor: colors.faint, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, image: { width: '100%', height: '100%' }, note: { color: colors.muted, fontSize: 12 } });
