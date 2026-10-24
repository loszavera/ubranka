import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Switch, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AppState, Locale, Profile } from '../domain/model';
import { copy } from '../i18n';
import type { PrivateItem, PrivateSettings, SaveItemInput } from '../private/model';
import { newPrivateId, usePrivateWardrobe } from '../private/usePrivateWardrobe';
import { Button, Chip, Dialog, styles as controls } from '../ui/Controls';
import { Icon } from '../ui/Icon';
import { ProfileForm } from '../ui/ProfileForm';
import { colors } from '../ui/theme';
import { privateCopy, privateError } from './copy';
import { ItemEditor } from './ItemEditor';

type PrivateApi = ReturnType<typeof usePrivateWardrobe>;
type Tab = 'wardrobe' | 'profiles' | 'account';

function Photo({ path, api, locale }: { path: string; api: PrivateApi; locale: Locale }) {
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
  return <View style={s.photo}>
    {current?.uri ? <Image source={{ uri: current.uri }} style={s.image} resizeMode="contain" accessibilityLabel={privateCopy(locale).photo} />
      : current?.error ? <Text style={s.note}>{privateCopy(locale).photoFailure}</Text> : <ActivityIndicator color={colors.plum} />}
  </View>;
}

function AccountContent({ api, locale, onDelete }: { api: PrivateApi; locale: Locale; onDelete: () => void }) {
  const t = privateCopy(locale);
  return <View style={{ gap: 20 }}>
    <View style={s.card}><Text style={s.cardTitle}>{t.privacy}</Text><Text style={s.body}>{t.privacySummary}</Text>
      <Text style={s.body}>{t.privacyDetails}</Text><Text style={s.note}>{t.backup}</Text></View>
    <View style={s.card}><Text style={s.cardTitle}>{t.export}</Text><Text style={s.body}>{t.exportHelp}</Text>
      <Button label={t.export} disabled={api.busy} onPress={() => { void api.exportData().catch(() => {}); }} />
    </View>
    <Button label={t.signOut} kind="secondary" disabled={api.busy} onPress={() => { void api.signOut().catch(() => {}); }} />
    <Button label={t.deleteAccount} kind="quiet" disabled={api.busy} onPress={onDelete} />
  </View>;
}

type PrivateWardrobeProps = {
  demoState: AppState; demoAvailable: boolean; onClose: () => void;
};
export default function PrivateWardrobe(props: PrivateWardrobeProps) {
  const api = usePrivateWardrobe();
  return <PrivateWardrobeView key={api.identity?.id ?? 'signed-out'} {...props} api={api} />;
}

function PrivateWardrobeView({ demoState, demoAvailable, onClose, api }: PrivateWardrobeProps & { api: PrivateApi }) {
  const [localLocale, setLocalLocale] = useState<Locale>(demoState.locale);
  const locale = api.snapshot?.state.data.locale ?? localLocale;
  const t = privateCopy(locale); const common = copy(locale);
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<Tab>('wardrobe');
  const [editor, setEditor] = useState<SaveItemInput | null>(null);
  const [profileEditor, setProfileEditor] = useState<{ profile: Profile; revision: number } | null>(null);
  const [deleting, setDeleting] = useState<PrivateItem | null>(null);
  const [confirmAccount, setConfirmAccount] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [includeFeedback, setIncludeFeedback] = useState(true);
  const [notice, setNotice] = useState('');
  const settings = api.snapshot?.state.data;
  const profileStale = !!profileEditor && !!api.snapshot && profileEditor.revision !== api.snapshot.state.revision;
  const newerProfile = settings?.profiles.find(profile => profile.id === profileEditor?.profile.id);
  const saveSettings = async (updated: PrivateSettings, revision: number) => {
    try { await api.saveSettings(updated, revision); setNotice(t.saved); return true; }
    catch { return false; }
  };
  const changeLanguage = (next: Locale) => {
    if (settings && api.snapshot) void saveSettings({ ...settings, locale: next }, api.snapshot.state.revision);
    else setLocalLocale(next);
  };
  const openEditor = (item?: PrivateItem) => {
    api.clearError(); setNotice('');
    setEditor(item ? { ...item, expectedRevision: item.revision } : {
      id: newPrivateId(), name: '', color: '', size: '', category: 'top', occasions: ['casual'], photoKind: 'garment',
    });
  };
  const newProfile = (): Profile => ({ id: newPrivateId(), name: '', audience: 'women', occasion: 'casual', budget: 500, priority: 'comfort', defaultMode: 'best' });
  const showImport = () => { setSelectedProfiles([]); setIncludeFeedback(true); setImporting(true); api.clearError(); };
  const importSelected = async () => {
    try { await api.importP2(demoState, selectedProfiles, includeFeedback); setImporting(false); setNotice(t.imported); }
    catch { /* Keep the explicit selection available for retry. */ }
  };
  const formError = api.error ? <Text accessibilityRole="alert" style={s.error}>{privateError(locale, api.error)}</Text> : null;

  return <SafeAreaView style={s.screen}>
    <View style={s.header}><View style={controls.row}><Icon name="hanger" size={26} /><Text style={s.logo}>ubranka</Text></View>
      <View style={controls.row}><Chip label="PL" selected={locale === 'pl'} onPress={() => changeLanguage('pl')} /><Chip label="EN" selected={locale === 'en'} onPress={() => changeLanguage('en')} /></View>
    </View>
    <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
      <View style={s.content}>
        <Button label={t.back} compact kind="quiet" disabled={api.busy} onPress={onClose} />
        <View style={{ gap: 10 }}><Text style={s.eyebrow}>{t.tagline}</Text><Text accessibilityRole="header" style={s.title}>{t.title}</Text></View>
        {api.error ? <View style={s.warning}>{formError}
          {api.identity ? <Button label={api.conflict ? t.reload : t.retry} kind="secondary" disabled={api.busy} onPress={() => { void api.refresh(); }} /> : null}
        </View> : null}
        {notice ? <Text accessibilityLiveRegion="polite" style={s.note}>{notice}</Text> : null}
        {api.deletion?.status === 'pending' ? <View style={s.warning}><Text style={s.cardTitle}>{t.pending}</Text><Text style={s.body}>{t.pendingHelp}</Text></View> : null}
        {api.status === 'loading' ? <View style={s.card}><ActivityIndicator color={colors.plum} /><Text style={s.body}>{t.loading}</Text></View> : null}
        {!api.identity && api.status !== 'loading' ? <View style={s.card}>
          <View style={s.symbol}><Icon name="wardrobe" size={40} /></View><Text style={s.body}>{t.intro}</Text>
          <Text style={s.note}>{t.invited}</Text><Text style={s.body}>{t.privacySummary}</Text>
          {!api.configured ? <Text accessibilityLiveRegion="polite" style={s.note}>{t.notConfigured}</Text> : null}
          <Button label={t.signIn} disabled={!api.configured || api.busy} onPress={() => { void api.signIn().catch(() => {}); }} />
          <Text style={s.note}>{t.backup}</Text>
        </View> : null}
        {api.identity && !api.snapshot && api.status !== 'loading' ? <Button label={t.signOut} kind="secondary" onPress={() => { void api.signOut().catch(() => {}); }} /> : null}
        {api.snapshot && settings ? <>
          <View style={s.accountLine}><Text style={s.note}>{api.identity?.email}</Text><Button label={t.refresh} kind="quiet" compact disabled={api.busy} onPress={() => { void api.refresh(); }} /></View>
          <View style={s.nav}>{(['wardrobe', 'profiles', 'account'] as const).map(key => <View key={key} style={{ flex: 1 }}><Button label={t[key]} selected={tab === key} kind={tab === key ? 'primary' : 'quiet'} compact onPress={() => { setTab(key); setNotice(''); }} /></View>)}</View>
          {tab === 'wardrobe' ? <>
            <View style={s.accountLine}><Text style={s.note}>{api.snapshot.items.length}/100 {t.count}</Text><Button label={t.add} icon="plus" disabled={api.busy || api.snapshot.items.length >= 100} onPress={() => openEditor()} /></View>
            {api.snapshot.items.length === 0 ? <View style={s.card}><Icon name="wardrobe" size={42} /><Text style={s.cardTitle}>{t.emptyTitle}</Text><Text style={s.body}>{t.emptyBody}</Text></View> : null}
            <View style={s.grid}>{api.snapshot.items.map(item => <View key={item.id} style={[s.item, { width: width >= 650 ? '48%' : '100%' }]}>
              {item.photo && item.status === 'active' ? <Photo path={item.photo.thumbPath} api={api} locale={locale} /> : <View style={s.photo}><Icon name="hanger" size={38} /></View>}
              <Text style={s.cardTitle}>{item.name}</Text><Text style={s.body}>{t.categories[item.category]} · {item.color}{item.size ? ` · ${item.size}` : ''}</Text>
              <Text style={s.note}>{item.occasions.map(occasion => common[occasion]).join(' · ')}</Text>
              {item.status === 'deleting' ? <Text style={s.note}>{t.pending}</Text> : <View style={controls.row}>
                <Button label={`${t.edit}: ${item.name}`} compact kind="secondary" disabled={api.busy} onPress={() => openEditor(item)} />
                <Button label={`${t.remove}: ${item.name}`} compact kind="quiet" disabled={api.busy} onPress={() => { api.clearError(); setDeleting(item); }} />
              </View>}
            </View>)}</View>
            <Text style={s.note}>{t.limit}</Text><Text style={s.note}>{t.future}</Text>
          </> : tab === 'profiles' ? <>
            {settings.profiles.length === 0 ? <Text style={s.body}>{t.noProfiles}</Text> : null}
            {settings.profiles.map(profile => <View key={profile.id} style={s.card}>
              <Text style={s.cardTitle}>{profile.name}</Text><Text style={s.body}>{common[profile.audience]} · {common[profile.occasion]}</Text>
              <View style={controls.row}>
                <Button kind={settings.activeProfileId === profile.id ? 'primary' : 'secondary'} compact label={`${settings.activeProfileId === profile.id ? t.active : common.selectProfile}: ${profile.name}`} disabled={api.busy} onPress={() => { void saveSettings({ ...settings, activeProfileId: profile.id }, api.snapshot!.state.revision); }} />
                <Button kind="quiet" compact label={`${t.edit}: ${profile.name}`} disabled={api.busy} onPress={() => { api.clearError(); setProfileEditor({ profile, revision: api.snapshot!.state.revision }); }} />
              </View>
            </View>)}
            <Button label={t.newProfile} kind="secondary" disabled={api.busy} onPress={() => { api.clearError(); setProfileEditor({ profile: newProfile(), revision: api.snapshot!.state.revision }); }} />
            <View style={s.accountLine}><Text style={s.body}>{t.reasonSetting}</Text><Switch accessibilityLabel={t.reasonSetting} value={settings.askReason} disabled={api.busy} onValueChange={askReason => { void saveSettings({ ...settings, askReason }, api.snapshot!.state.revision); }} /></View>
            <Button label={t.import} kind="secondary" disabled={api.busy || !demoAvailable} onPress={showImport} />
            {!demoAvailable ? <Text style={s.note}>{t.localUnavailable}</Text> : null}
          </> : <AccountContent api={api} locale={locale} onDelete={() => { api.clearError(); setConfirmAccount(true); }} />}
        </> : null}
      </View>
    </ScrollView>
    <Dialog visible={!!editor} title={editor?.expectedRevision === undefined ? t.add : t.edit} closeLabel={t.cancel} onClose={() => { if (!api.busy) setEditor(null); }}>
      {editor ? <ItemEditor key={editor.id} initial={editor} latest={api.snapshot?.items.find(item => item.id === editor.id)} pendingSave={api.pendingSave} locale={locale} busy={api.busy} onClose={() => setEditor(null)} onSave={async (input, photo) => {
        try { await api.saveItem(input, photo); setNotice(t.saved); return true; } catch { return false; }
      }} /> : null}
      {formError}{api.conflict ? <Button label={t.reload} kind="secondary" onPress={() => { void api.refresh(); }} /> : null}
    </Dialog>
    <Dialog visible={!!profileEditor} title={common.preferences} closeLabel={t.cancel} onClose={() => { if (!api.busy) setProfileEditor(null); }}>
      {profileEditor && settings ? <View pointerEvents={api.busy ? 'none' : 'auto'}>
        <ProfileForm key={profileEditor.profile.id} profile={profileEditor.profile} locale={locale} disabled={api.busy || profileStale} onSave={profile => {
          const updated = { ...settings, activeProfileId: profile.id, profiles: settings.profiles.some(value => value.id === profile.id) ? settings.profiles.map(value => value.id === profile.id ? profile : value) : [...settings.profiles, profile] };
          void saveSettings(updated, profileEditor.revision).then(saved => { if (saved) setProfileEditor(null); });
        }} />
      </View> : null}
      {formError}{api.conflict ? <><Text style={s.body}>{t.conflict}</Text><Button label={t.reload} kind="secondary" onPress={() => { void api.refresh(); }} /></> : null}
      {profileStale && profileEditor && api.snapshot ? <View style={s.warning}>
        <Text style={s.body}>{t.conflict}</Text>
        {newerProfile ? <Text style={s.body}>{t.newerVersion}: {newerProfile.name} · {common[newerProfile.audience]} · {common[newerProfile.occasion]} · {newerProfile.budget} PLN · {common[newerProfile.priority]} · {common[newerProfile.defaultMode]}</Text> : null}
        <Button kind="secondary" label={t.applyDraft} onPress={() => setProfileEditor({ ...profileEditor, revision: api.snapshot!.state.revision })} />
      </View> : null}
    </Dialog>
    <Dialog visible={!!deleting} title={t.removeTitle} closeLabel={t.cancel} onClose={() => { if (!api.busy) setDeleting(null); }}>
      <Text style={s.cardTitle}>{deleting?.name}</Text><Text style={s.body}>{t.removeBody}</Text>{formError}
      <Button label={t.confirmRemove} disabled={api.busy} onPress={() => { if (deleting) void api.deleteItem(deleting).then(() => setDeleting(null)).catch(() => {}); }} />
    </Dialog>
    <Dialog visible={confirmAccount} title={t.deleteAccountTitle} closeLabel={t.cancel} onClose={() => { if (!api.busy) setConfirmAccount(false); }}>
      <Text style={s.body}>{t.deleteAccountBody}</Text>{formError}
      <Button label={t.deleteAccountConfirm} disabled={api.busy} onPress={() => { void api.deleteAccount().then(() => setConfirmAccount(false)).catch(() => {}); }} />
    </Dialog>
    <Dialog visible={importing} title={t.import} closeLabel={t.cancel} onClose={() => { if (!api.busy) setImporting(false); }}>
      <Text style={s.body}>{t.importHelp}</Text>
      {demoState.profiles.map(profile => <Chip key={profile.id} label={profile.name || common[profile.occasion]} selected={selectedProfiles.includes(profile.id)} onPress={() => setSelectedProfiles(selectedProfiles.includes(profile.id) ? selectedProfiles.filter(id => id !== profile.id) : [...selectedProfiles, profile.id])} />)}
      <View style={s.accountLine}><Text style={[s.body, { flex: 1 }]}>{t.includeFeedback}</Text><Switch accessibilityLabel={t.includeFeedback} value={includeFeedback} onValueChange={setIncludeFeedback} /></View>
      {formError}<Button label={t.importConfirm} disabled={!selectedProfiles.length || api.busy} onPress={() => { void importSelected(); }} />
    </Dialog>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: colors.line },
  logo: { color: colors.plum, fontSize: 27, fontWeight: '800', letterSpacing: -1.5 },
  scroll: { flexGrow: 1, alignItems: 'center' }, content: { width: '100%', maxWidth: 800, padding: 20, gap: 22, paddingBottom: 40 },
  title: { color: colors.ink, fontSize: 34, fontWeight: '700', letterSpacing: -1.1, lineHeight: 40 },
  eyebrow: { color: colors.muted, fontSize: 13, lineHeight: 21 }, body: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  note: { color: colors.muted, fontSize: 12, lineHeight: 19, flexShrink: 1 }, error: { color: colors.error, fontSize: 14, lineHeight: 22 },
  card: { borderRadius: 22, backgroundColor: colors.surface, padding: 22, gap: 16, borderWidth: 1, borderColor: colors.line },
  cardTitle: { color: colors.ink, fontSize: 21, lineHeight: 28, fontWeight: '600' },
  symbol: { padding: 20, borderRadius: 20, backgroundColor: colors.faint, alignSelf: 'flex-start' },
  nav: { flexDirection: 'row', gap: 4, borderRadius: 16, backgroundColor: colors.faint, padding: 4 },
  accountLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  grid: { flexDirection: 'row', gap: 18, flexWrap: 'wrap' },
  item: { padding: 16, borderWidth: 1, borderColor: colors.line, borderRadius: 22, backgroundColor: colors.surface, gap: 12 },
  photo: { height: 210, borderRadius: 16, backgroundColor: colors.faint, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { width: '100%', height: '100%' }, warning: { borderRadius: 14, padding: 16, backgroundColor: '#F2E6CE', gap: 12 },
});
