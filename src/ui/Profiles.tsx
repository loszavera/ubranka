import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import type { AppState, Locale, Profile } from '../domain/model';
import { copy, money } from '../i18n';
import { Button, Chip, Dialog, styles } from './Controls';
import { ProfileForm } from './ProfileForm';
import { colors } from './theme';

export function profileLabel(profile: Profile, locale: Locale) {
  if (profile.id === 'everyday' && ['Na co dzień', 'Codzienny', 'Everyday'].includes(profile.name)) return copy(locale).casual;
  if (profile.id === 'elegant' && ['Elegancki', 'Elegancko', 'Smart'].includes(profile.name)) return copy(locale).elegant;
  return profile.name;
}

export function Profiles({ state, onSelect, onSave, onLanguage, onAskReason, onReset }: {
  state: AppState; onSelect: (id: string) => void; onSave: (profile: Profile) => void;
  onLanguage: (locale: Locale) => void; onAskReason: (value: boolean) => void; onReset: () => void;
}) {
  const t = copy(state.locale);
  const [editing, setEditing] = useState<Profile|null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [saved, setSaved] = useState(false);
  const profile = state.profiles.find(p => p.id === state.activeProfileId)!;
  return <View style={{ gap: 22 }}>
    <Text style={styles.label}>{t.profiles}</Text>
    {state.profiles.map(p => <View key={p.id} style={[s.profileCard, p.id === profile.id && s.active]}>
      <View style={{ flex: 1, gap: 7 }}><Text style={s.name}>{profileLabel(p, state.locale)}</Text>
        <Text style={s.help}>{t[p.audience]} · {t[p.occasion]} · {money(p.budget, state.locale)}</Text>
      </View>
      <View style={styles.row}><Chip label={`${p.id === profile.id ? t.activeProfile : t.selectProfile}: ${profileLabel(p, state.locale)}`} selected={p.id === profile.id} onPress={() => onSelect(p.id)} />
        <Button compact kind="quiet" icon="tune" label={`${t.edit}: ${profileLabel(p, state.locale)}`} onPress={() => { setSaved(false); setEditing(p); }} /></View>
    </View>)}
    <Button label={t.newProfile} kind="secondary" icon="plus" onPress={() => { setSaved(false); setEditing({ ...profile, id: `style-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: '' }); }} />
    {saved ? <Text accessibilityLiveRegion="polite" style={s.help}>{t.saved}</Text> : null}
    <View style={s.section}><Text style={styles.label}>{t.language}</Text><View style={styles.row}>
      <Chip label="Polski" selected={state.locale === 'pl'} onPress={() => onLanguage('pl')} />
      <Chip label="English" selected={state.locale === 'en'} onPress={() => onLanguage('en')} />
    </View></View>
    <View style={[s.section, { flexDirection: 'row', alignItems: 'center' }]}>
      <View style={{ flex: 1, gap: 7 }}><Text style={styles.label}>{t.reasonSetting}</Text><Text style={s.help}>{t.reasonSettingHelp}</Text></View>
      <Switch accessibilityLabel={t.reasonSetting} value={state.askReason} onValueChange={onAskReason} trackColor={{ false: colors.line, true: colors.plum }} thumbColor={colors.white} />
    </View>
    <View style={s.section}><Text style={styles.label}>{t.feedbackCount}: {state.feedback.filter(f => f.profileId === profile.id).length}</Text>
      <Text style={s.name}>{t.localData}</Text><Text style={s.help}>{t.localDataBody}</Text>
      <Button kind="quiet" label={t.reset} onPress={() => setConfirmReset(true)} />
    </View>
    <Dialog visible={!!editing} title={t.preferences} closeLabel={t.close} onClose={() => setEditing(null)}>
      {editing ? <ProfileForm key={editing.id} profile={editing} locale={state.locale} onCancel={() => setEditing(null)} onSave={p => { onSave(p); setEditing(null); setSaved(true); }} /> : null}
    </Dialog>
    <Dialog visible={confirmReset} title={t.resetConfirm} closeLabel={t.cancel} onClose={() => setConfirmReset(false)}>
      <Text style={s.help}>{t.resetBody}</Text><Button label={t.resetYes} onPress={() => { setConfirmReset(false); onReset(); }} />
    </Dialog>
  </View>;
}
const s = StyleSheet.create({
  profileCard: { borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 18, backgroundColor: colors.surface, gap: 16 },
  active: { borderColor: colors.plum, backgroundColor: '#F0E8EC' },
  name: { color: colors.ink, fontSize: 18, fontWeight: '600', letterSpacing: -0.4 }, help: { color: colors.muted, fontSize: 13, lineHeight: 21 },
  section: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 22, gap: 13 },
});
