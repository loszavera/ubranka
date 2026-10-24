import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, Text, View } from 'react-native';
import type { Locale } from '../domain/model';
import { normalizeBodyFitData, type BodyFit } from '../private/model';
import { pickAndPreparePhoto } from '../private/photos';
import type { PreparedPhoto } from '../private/photos.types';
import type { usePrivateWardrobe } from '../private/usePrivateWardrobe';
import { Button, Chip, Dialog, Field, styles } from '../ui/Controls';
import { colors } from '../ui/theme';
import { privateCopy, privateError } from './copy';
import { p33Copy } from './p33copy';
import { p33Styles as s } from './p33styles';
import { PrivatePhoto } from './PrivatePhoto';

type Api = ReturnType<typeof usePrivateWardrobe>;
const measurements = ['heightCm', 'chestCm', 'waistCm', 'hipsCm'] as const;
const sizes = ['topSize', 'bottomSize', 'shoeSize'] as const;

function FitForm({ initial, latest, api, locale, onClose }: { initial: BodyFit; latest: BodyFit; api: Api; locale: Locale; onClose: () => void }) {
  const t = p33Copy(locale);
  const [draft, setDraft] = useState(initial.data);
  const [numbers, setNumbers] = useState(Object.fromEntries(measurements.map(key => [key, initial.data[key] === null ? '' : String(initial.data[key])])) as Record<typeof measurements[number], string>);
  const [revision, setRevision] = useState(initial.revision);
  const [error, setError] = useState('');
  const stale = revision !== latest.revision;
  const save = async () => {
    if (api.busy || stale) return;
    try {
      const data = normalizeBodyFitData({ ...draft, ...Object.fromEntries(measurements.map(key => [key, numbers[key].trim() ? Number(numbers[key].trim().replace(',', '.')) : null])) });
      await api.saveBodyFit(data, revision); onClose();
    } catch (issue) { setError(privateError(locale, issue)); }
  };
  return <View style={s.stack} pointerEvents={api.busy ? 'none' : 'auto'} {...(Platform.OS === 'web' && api.busy ? { inert: true } : {})}>
    <Text style={s.body}>{t.fitIntro}</Text>
    {measurements.map(key => <Field key={key} label={t[key]} value={numbers[key]} editable={!api.busy} maxLength={6} keyboardType="decimal-pad" onChangeText={value => setNumbers({ ...numbers, [key]: value })} />)}
    <Text style={styles.label}>{t.sizeSystem}</Text><View style={styles.row}>{(['EU', 'UK', 'US', 'other'] as const).map(value => <Chip key={value} label={value === 'other' ? t.other : value} selected={draft.sizeSystem === value} disabled={api.busy} onPress={() => setDraft({ ...draft, sizeSystem: value })} />)}</View>
    {sizes.map(key => <Field key={key} label={t[key]} value={draft[key]} editable={!api.busy} maxLength={30} onChangeText={value => setDraft({ ...draft, [key]: value })} />)}
    {stale ? <View style={s.warning}><Text style={s.body}>{t.stale}</Text>
      <Text style={s.note}>{t.current}: {measurements.map(key => `${t[key]}: ${latest.data[key] ?? t.missing}`).join(' · ')} · {latest.data.sizeSystem} · {sizes.map(key => `${t[key]}: ${latest.data[key] || t.missing}`).join(' · ')}</Text>
      <Button label={t.rebase} kind="secondary" disabled={api.busy} onPress={() => { setRevision(latest.revision); setError(''); api.clearError(); }} /></View> : null}
    {error ? <Text style={s.error} accessibilityRole="alert">{error}</Text> : null}
    {api.conflict ? <Button label={privateCopy(locale).reload} kind="secondary" disabled={api.busy} onPress={() => { void api.refresh(); }} /> : null}
    <Button label={t.save} disabled={api.busy || stale} onPress={() => { void save(); }} />
  </View>;
}

export function BodyFitPanel({ api, locale }: { api: Api; locale: Locale }) {
  const t = p33Copy(locale); const body = api.snapshot?.bodyFit;
  const [editor, setEditor] = useState<BodyFit | null>(null);
  const [photo, setPhoto] = useState<PreparedPhoto>();
  const [photoRevision, setPhotoRevision] = useState<number>();
  const [consent, setConsent] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [deleteRevision, setDeleteRevision] = useState<number | null>(null);
  const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const currentPhoto = useRef<PreparedPhoto | undefined>(undefined);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => { controller.current?.abort(); currentPhoto.current?.dispose(); }, []);
  if (!body) return <Text style={s.body}>{t.unavailable}</Text>;
  const discard = () => { currentPhoto.current?.dispose(); currentPhoto.current = undefined; setPhoto(undefined); setConsent(false); setPhotoRevision(undefined); };
  const choose = async (source: 'library' | 'camera') => {
    if (api.busy) return;
    controller.current?.abort(); const request = new AbortController(); controller.current = request;
    setPreparing(true); setError(''); setNotice('');
    const revision = body.revision;
    try {
      const prepared = await pickAndPreparePhoto(source, request.signal);
      if (request.signal.aborted) { prepared?.dispose(); return; }
      if (prepared) { currentPhoto.current?.dispose(); currentPhoto.current = prepared; setPhoto(prepared); setPhotoRevision(revision); setConsent(false); }
    } catch (issue) { if (!request.signal.aborted) setError(privateError(locale, issue)); }
    finally { if (!request.signal.aborted) setPreparing(false); }
  };
  const upload = async () => {
    if (!photo || photoRevision === undefined || !consent || api.busy || body.revision !== photoRevision) return;
    try { await api.uploadBodyPhoto(photoRevision, photo, consent); discard(); setNotice(t.saved); }
    catch (issue) { setError(privateError(locale, issue)); }
  };
  return <View style={s.stack}>
    <View style={s.card}><Text accessibilityRole="header" style={s.title}>{t.fit}</Text><Text style={s.body}>{t.fitIntro}</Text>
      {measurements.map(key => <Text key={key} style={s.body}>{t[key]}: {body.data[key] ?? t.missing}</Text>)}
      <Text style={s.body}>{t.sizeSystem}: {body.data.sizeSystem === 'other' ? t.other : body.data.sizeSystem}</Text>
      {sizes.map(key => <Text key={key} style={s.body}>{t[key]}: {body.data[key] || t.missing}</Text>)}
      <Button label={t.editFit} kind="secondary" disabled={api.busy || preparing} onPress={() => { api.clearError(); setEditor(body); }} />
    </View>
    <View style={s.card}><Text accessibilityRole="header" style={s.title}>{t.fitPhoto}</Text><Text style={s.body}>{t.fitPhotoIntro}</Text>
      {body.photo ? <PrivatePhoto path={body.photo.thumbPath} api={api} locale={locale} label={t.fitPhoto} /> : null}
      {body.photoDeletion === 'pending' ? <Text style={s.note}>{t.bodyPending}</Text> : null}
      {photo ? <Image source={{ uri: photo.previewUri }} style={s.image} resizeMode="contain" accessibilityLabel={t.fitPhoto} /> : null}
      <View style={styles.row}><Button label={t.choosePhoto} kind="secondary" disabled={api.busy || preparing} onPress={() => { void choose('library'); }} /><Button label={t.camera} kind="secondary" disabled={api.busy || preparing} onPress={() => { void choose('camera'); }} /></View>
      {preparing ? <View style={styles.row}><ActivityIndicator color={colors.plum} /><Text style={s.note}>{t.preparing}</Text></View> : null}
      <Text style={s.body}>{t.bodyPrivacy}</Text>
      {photo ? <><Chip label={t.bodyConsent} selected={consent} disabled={api.busy} onPress={() => setConsent(!consent)} />
        {photoRevision !== body.revision ? <View style={s.warning}><Text style={s.body}>{t.stale}</Text><Button label={t.rebase} disabled={api.busy} kind="secondary" onPress={() => { setPhotoRevision(body.revision); api.clearError(); setError(''); }} /></View> : null}
        <Button label={t.photoSave} disabled={api.busy || preparing || !consent || photoRevision !== body.revision} onPress={() => { void upload(); }} />
        <Button label={t.discard} kind="quiet" disabled={api.busy} onPress={discard} /></> : null}
      {body.photo ? <Button label={t.removePhoto} kind="quiet" disabled={api.busy || preparing} onPress={() => { api.clearError(); setDeleteRevision(body.revision); setNotice(''); }} /> : null}
      {error ? <Text style={s.error} accessibilityRole="alert">{error}</Text> : null}{notice ? <Text accessibilityLiveRegion="polite" style={s.note}>{notice}</Text> : null}
    </View>
    <Dialog visible={!!editor} title={t.editFit} closeLabel={t.cancel} onClose={() => { if (!api.busy) setEditor(null); }}>
      {editor ? <FitForm initial={editor} latest={body} api={api} locale={locale} onClose={() => { setEditor(null); setNotice(t.saved); }} /> : null}
    </Dialog>
    <Dialog visible={deleteRevision !== null} title={t.removePhoto} closeLabel={t.cancel} onClose={() => { if (!api.busy) setDeleteRevision(null); }}>
      <Text style={s.body}>{t.removePhotoBody}</Text>{deleteRevision !== body.revision ? <Text style={s.error}>{t.stale}</Text> : null}
      {error ? <Text style={s.error} accessibilityRole="alert">{error}</Text> : null}
      {api.conflict ? <Button label={privateCopy(locale).reload} kind="secondary" disabled={api.busy} onPress={() => { void api.refresh(); }} /> : null}
      <Button label={t.removePhoto} disabled={api.busy || deleteRevision !== body.revision} onPress={() => { if (deleteRevision !== null) void api.deleteBodyPhoto(deleteRevision).then(() => setDeleteRevision(null)).catch(issue => setError(privateError(locale, issue))); }} />
    </Dialog>
  </View>;
}
