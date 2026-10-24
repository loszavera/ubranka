import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, Text, View } from 'react-native';
import { OCCASIONS, type Locale } from '../domain/model';
import { copy } from '../i18n';
import { PRIVATE_CATEGORIES, type PrivateItem, type SaveItemInput } from '../private/model';
import { pickAndPreparePhoto } from '../private/photos';
import type { PreparedPhoto } from '../private/photos.types';
import { Button, Chip, Field, styles } from '../ui/Controls';
import { colors } from '../ui/theme';
import { privateCopy, privateError } from './copy';

export function ItemEditor({ initial, latest, pendingSave, locale, busy, onSave, onClose }: {
  initial: SaveItemInput; latest?: PrivateItem; locale: Locale; busy: boolean;
  pendingSave?: { itemId: string; baseRevision: number | undefined; revision: number } | null;
  onSave: (input: SaveItemInput, photo?: PreparedPhoto) => Promise<boolean>; onClose: () => void;
}) {
  const t = privateCopy(locale); const common = copy(locale);
  const [draft, setDraft] = useState(initial);
  const [photo, setPhoto] = useState<PreparedPhoto>();
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState('');
  const [consent, setConsent] = useState(false);
  const currentPhoto = useRef<PreparedPhoto | undefined>(undefined);
  const controller = useRef<AbortController | null>(null);
  const submitting = useRef(false);
  useEffect(() => () => { controller.current?.abort(); currentPhoto.current?.dispose(); }, []);
  const ownPendingSave = pendingSave?.itemId === draft.id && pendingSave.baseRevision === draft.expectedRevision && pendingSave.revision === latest?.revision;
  const changed = latest && draft.expectedRevision !== undefined && latest.revision !== draft.expectedRevision && !ownPendingSave;
  const choosePhoto = async (source: 'library' | 'camera') => {
    controller.current?.abort(); const request = new AbortController(); controller.current = request;
    setPreparing(true); setError('');
    try {
      const prepared = await pickAndPreparePhoto(source, request.signal);
      if (request.signal.aborted) { prepared?.dispose(); return; }
      if (prepared) { currentPhoto.current?.dispose(); currentPhoto.current = prepared; setPhoto(prepared); }
    } catch (issue) { if (!request.signal.aborted) setError(privateError(locale, issue)); }
    finally { if (!request.signal.aborted) setPreparing(false); }
  };
  const save = async () => {
    if (submitting.current || busy || preparing || changed) return;
    if (!draft.name.trim() || !draft.color.trim() || !draft.occasions.length) { setError(t.nameRequired); return; }
    if (!photo && !latest?.photo) { setError(t.photoRequired); return; }
    setError('');
    submitting.current = true;
    try { if (await onSave(draft, photo)) onClose(); }
    finally { submitting.current = false; }
  };
  return <View style={{ gap: 18 }} pointerEvents={busy ? 'none' : 'auto'} {...(Platform.OS === 'web' && busy ? { inert: true } : {})}>
    <Field label={t.name} editable={!busy} value={draft.name} maxLength={100} onChangeText={name => setDraft({ ...draft, name })} />
    <View style={{ gap: 8 }}><Text style={styles.label}>{t.category}</Text><View style={styles.row}>
      {PRIVATE_CATEGORIES.map(category => <Chip key={category} label={t.categories[category]} selected={draft.category === category} onPress={() => setDraft({ ...draft, category })} />)}
    </View></View>
    <Field label={t.color} editable={!busy} value={draft.color} maxLength={50} onChangeText={color => setDraft({ ...draft, color })} />
    <Field label={t.size} editable={!busy} value={draft.size} maxLength={30} onChangeText={size => setDraft({ ...draft, size })} />
    <View style={{ gap: 8 }}><Text style={styles.label}>{t.occasions}</Text><View style={styles.row}>
      {OCCASIONS.map(occasion => <Chip key={occasion} label={common[occasion]} selected={draft.occasions.includes(occasion)} onPress={() => setDraft({ ...draft, occasions: draft.occasions.includes(occasion) ? draft.occasions.filter(value => value !== occasion) : [...draft.occasions, occasion] })} />)}
    </View></View>
    <View style={{ gap: 8 }}><Text style={styles.label}>{t.photoKind}</Text><View style={styles.row}>
      {(['garment', 'person'] as const).map(photoKind => <Chip key={photoKind} label={t[photoKind]} selected={draft.photoKind === photoKind} onPress={() => setDraft({ ...draft, photoKind })} />)}
    </View></View>
    {photo ? <Image source={{ uri: photo.previewUri }} style={{ width: '100%', height: 240, borderRadius: 18 }} resizeMode="contain" accessibilityLabel={t.photo} /> : null}
    <View style={styles.row}>
      <Button kind="secondary" label={t.library} disabled={preparing || busy} onPress={() => { void choosePhoto('library'); }} />
      <Button kind="secondary" label={t.camera} disabled={preparing || busy} onPress={() => { void choosePhoto('camera'); }} />
    </View>
    {preparing ? <View style={styles.row}><ActivityIndicator color={colors.plum} /><Text>{t.preparing}</Text></View> : null}
    <Text style={{ color: colors.muted, lineHeight: 21 }}>{t.photoHelp}</Text>
    {photo ? <Chip label={t.consent} selected={consent} onPress={() => setConsent(!consent)} /> : null}
    {changed ? <View style={{ gap: 10, padding: 14, borderRadius: 12, backgroundColor: colors.faint }}>
      <Text accessibilityRole="alert" style={{ color: colors.ink }}>{t.conflict}</Text>
      <Text style={{ color: colors.ink }}>{t.newerVersion}: {latest.name} · {latest.color} · {latest.size} · {latest.occasions.map(value => common[value]).join(', ')}</Text>
      <Button kind="secondary" label={t.applyDraft} onPress={() => setDraft({ ...draft, expectedRevision: latest.revision })} />
    </View> : null}
    {error ? <Text accessibilityRole="alert" style={{ color: colors.error }}>{error}</Text> : null}
    <Button label={busy ? t.saving : t.save} disabled={busy || preparing || !!changed || (!!photo && !consent)} onPress={() => { void save(); }} />
    <Button kind="quiet" label={t.cancel} disabled={busy} onPress={onClose} />
  </View>;
}
