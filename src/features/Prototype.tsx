import { useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AppState, Feedback, Locale, Profile } from '../domain/model';
import { OUTFITS } from '../domain/catalog';
import { recommendOutfits } from '../domain/recommendations';
import { updateFeedback } from '../domain/state';
import { copy, money } from '../i18n';
import { useOnline, usePrototype } from '../state/usePrototype';
import { Button, Chip, Dialog, styles as controls } from '../ui/Controls';
import { Icon, type IconName } from '../ui/Icon';
import { OutfitCard, outfitImages } from '../ui/OutfitCard';
import { ProfileForm } from '../ui/ProfileForm';
import { Profiles, profileLabel } from '../ui/Profiles';
import { Wardrobe } from '../ui/Wardrobe';
import { colors } from '../ui/theme';

type Tab = 'outfits'|'wardrobe'|'profile';
type Session = { active: boolean; ids: string[]; seen: string[]; votes: Record<string, 'like'|'dislike'>; round: number };
const emptySession = (): Session => ({ active: false, ids: [], seen: [], votes: {}, round: 0 });
const nav: { key: Tab; icon: IconName }[] = [{ key: 'outfits', icon: 'hanger' }, { key: 'wardrobe', icon: 'wardrobe' }, { key: 'profile', icon: 'person' }];

export default function Prototype() {
  const { state, setState, ready, storageIssue, retry, reset } = usePrototype();
  const online = useOnline();
  const t = copy(state.locale);
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 800;
  const singleColumn = width < 340 || fontScale > 1.35;
  const [tab, setTab] = useState<Tab>('outfits');
  const [session, setSession] = useState<Session>(emptySession);
  const [pendingReason, setPendingReason] = useState<Feedback|null>(null);
  const [editProfile, setEditProfile] = useState(false);
  const [confirmRecovery, setConfirmRecovery] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const profile = state.profiles.find(p => p.id === state.activeProfileId)!;

  const changeTab = (next: Tab) => { setTab(next); scroll.current?.scrollTo({ y: 0, animated: false }); };
  const changeLanguage = (locale: Locale) => setState(current => ({ ...current, locale }));
  const begin = (current: AppState = state, seen: string[] = [], round = 1) => {
    const active = current.profiles.find(p => p.id === current.activeProfileId)!;
    const results = recommendOutfits({ profile: active, ownedItemIds: current.ownedItemIds, feedback: current.feedback, excludeIds: seen, mode: active.defaultMode });
    setSession({ active: true, ids: results.map(o => o.id), seen, votes: {}, round });
  };
  const nextPair = (current: AppState = state) => begin(current, [...session.seen, ...session.ids], session.round + 1);
  const selectProfile = (id: string) => { setState(current => ({ ...current, activeProfileId: id })); setSession(emptySession()); };
  const saveProfile = (updated: Profile) => {
    setState(current => ({ ...current, activeProfileId: updated.id, profiles: current.profiles.some(p => p.id === updated.id) ? current.profiles.map(p => p.id === updated.id ? updated : p) : [...current.profiles, updated] }));
    setSession(emptySession()); setEditProfile(false);
  };
  const vote = (outfitId: string, value: 'like'|'dislike') => {
    if (session.votes[outfitId]) return;
    const feedback: Feedback = { profileId: profile.id, outfitId, vote: value };
    const updated = updateFeedback(state, feedback);
    const votes = { ...session.votes, [outfitId]: value };
    setState(updated); setSession(current => ({ ...current, votes }));
    if (value === 'dislike' && state.askReason) setPendingReason(feedback);
    else if (session.ids.every(id => votes[id] === 'dislike')) nextPair(updated);
  };
  const finishReason = (reason?: string) => {
    if (!pendingReason) return;
    const updated = reason ? updateFeedback(state, { ...pendingReason, reason }) : state;
    if (reason) setState(updated);
    setPendingReason(null);
    if (session.ids.every(id => session.votes[id] === 'dislike')) nextPair(updated);
  };
  const onReset = () => { setSession(emptySession()); changeTab('outfits'); void reset(); };

  if (!ready) return <SafeAreaView style={[s.screen, s.loading]}><ActivityIndicator color={colors.plum} /><Text style={s.body}>{t.loading}</Text></SafeAreaView>;

  // Do not allow edits over an unread saved profile: a later read could erase them
  // or attach votes from the visible session to a different restored profile.
  if (storageIssue === 'read' || storageIssue === 'invalid') return <SafeAreaView style={[s.screen, s.loading, { padding: 24 }]}>
    <View style={[s.promptCard, { maxWidth: 480, width: '100%' }]}>
      <Icon name="wardrobe" size={36} /><Text style={s.logo}>ubranka</Text>
      <Text accessibilityRole="alert" style={s.body}>{storageIssue === 'invalid' ? t.storageInvalid : t.storageReadError}</Text>
      <Button label={t.retry} onPress={() => { setSession(emptySession()); void retry(); }} />
      <Button kind="quiet" label={t.reset} onPress={() => setConfirmRecovery(true)} />
    </View>
    <Dialog visible={confirmRecovery} title={t.resetConfirm} closeLabel={t.cancel} onClose={() => setConfirmRecovery(false)}>
      <Text style={s.body}>{t.resetBody}</Text><Button label={t.resetYes} onPress={() => { setConfirmRecovery(false); onReset(); }} />
    </Dialog>
  </SafeAreaView>;

  const navigation = <View style={s.navigation}>{nav.map(item => <View key={item.key} style={{ flex: 1 }}>
    <Button label={t[item.key]} icon={item.icon} kind={tab === item.key ? 'primary' : 'quiet'} compact selected={tab === item.key} onPress={() => changeTab(item.key)} />
  </View>)}</View>;

  return <SafeAreaView style={s.screen}>
    <View style={s.headerShell}><View style={s.header}>
      <View style={s.brand}><Icon name="hanger" size={28} /><Text style={s.logo}>ubranka</Text></View>
      {wide && state.onboarded ? <View style={{ width: 360 }}>{navigation}</View> : null}
      <View style={[controls.row, { gap: 5 }]}>
        <Chip label={wide ? 'Polski' : 'PL'} selected={state.locale === 'pl'} onPress={() => changeLanguage('pl')} />
        <Chip label={wide ? 'English' : 'EN'} selected={state.locale === 'en'} onPress={() => changeLanguage('en')} />
      </View>
    </View></View>
    <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
      <View style={[s.content, !state.onboarded && { maxWidth: 980 }]}>
        {!online ? <Text accessibilityLiveRegion="polite" style={s.banner}>{t.offline}</Text> : null}
        {storageIssue ? <View style={s.banner}>
          <Text accessibilityRole="alert" style={s.body}>{t.storageError}</Text>
          <Button kind="secondary" compact label={t.retry} onPress={() => { void retry(); }} />
        </View> : null}
        {!state.onboarded ? <View style={[s.welcomeLayout, wide && { flexDirection: 'row' }]}>
          <View style={s.welcomeIntro}>
            <View style={s.demoBadge}><View style={s.dot} /><Text style={s.badgeText}>{t.demo}</Text></View>
            <Text style={s.eyebrow}>{t.tagline}</Text>
            <Text accessibilityRole="header" style={[s.welcomeTitle, wide && { fontSize: 52, lineHeight: 57 }]}>{t.welcome}</Text>
            <Text style={s.intro}>{t.welcomeBody}</Text>
            <View style={s.welcomePhotos}>
              <View style={s.welcomePhoto}><Image source={outfitImages.w1} style={s.welcomeImage} resizeMode="cover" accessibilityLabel={`${t.outfit} · ${t.women}`} /></View>
              <View style={[s.welcomePhoto, { marginTop: 24 }]}><Image source={outfitImages.m2} style={s.welcomeImage} resizeMode="cover" accessibilityLabel={`${t.outfit} · ${t.men}`} /></View>
            </View>
            <Text style={s.caption}>{t.demoNote}</Text>
          </View>
          <View style={s.welcomeForm}>
            <ProfileForm profile={profile} locale={state.locale} welcome onSave={updated => {
              const updatedState: AppState = { ...state, onboarded: true, profiles: state.profiles.map(p => p.id === updated.id ? updated : { ...p, audience: updated.audience }) };
              setState(updatedState); begin(updatedState); scroll.current?.scrollTo({ y: 0, animated: false });
            }} />
            <Text style={s.caption}>{t.welcomeNote}</Text>
          </View>
        </View> : <>
          <View style={s.headingBlock}>
            <View style={s.headingTop}><Text style={s.eyebrow}>{t.hello}</Text><View style={s.demoBadge}><View style={s.dot} /><Text style={s.badgeText}>{t.demo}</Text></View></View>
            <Text accessibilityRole="header" style={[s.title, wide && { fontSize: 42, lineHeight: 48 }]}>{tab === 'outfits' ? t.outfitTitle : tab === 'wardrobe' ? t.wardrobeTitle : t.profileTitle}</Text>
            <Text style={s.body}>{tab === 'outfits' ? t.outfitBody : tab === 'wardrobe' ? t.wardrobeBody : t.profileBody}</Text>
          </View>
          {tab === 'outfits' ? <View style={{ gap: 22 }}>
            <View style={s.preferences}>
              <View style={controls.row}>{state.profiles.map(p => <Chip key={p.id} label={profileLabel(p, state.locale)} selected={p.id === profile.id} onPress={() => selectProfile(p.id)} />)}
                <Chip label={money(profile.budget, state.locale)} icon="bag" onPress={() => setEditProfile(true)} />
              </View>
              <View accessibilityLabel={t.comparison} style={s.modes}>{(['best', 'value'] as const).map(mode => <View key={mode} style={{ flex: 1 }}>
                <Button kind={profile.defaultMode === mode ? 'primary' : 'quiet'} compact selected={profile.defaultMode === mode} label={t[mode]}
                  onPress={() => saveProfile({ ...profile, defaultMode: mode })} />
              </View>)}</View>
            </View>
            {!session.active ? <View style={s.promptCard}>
              <View style={s.bigIcon}><Icon name="spark" size={30} /></View><Text style={s.cardTitle}>{t.readyTitle}</Text><Text style={s.body}>{t.readyBody}</Text>
              <Button label={t.ask} icon="arrow" onPress={() => begin()} />
            </View> : session.ids.length === 0 ? <View style={s.promptCard}>
              <View style={s.bigIcon}><Icon name="hanger" size={32} /></View>
              <Text accessibilityRole="header" style={s.cardTitle}>{session.seen.length ? t.noMore : t.noBudget}</Text>
              <Text style={s.body}>{session.seen.length ? t.noMoreBody : t.noBudgetBody}</Text>
              <Button label={t.restart} onPress={() => begin()} /><Button label={t.editPreferences} kind="secondary" onPress={() => setEditProfile(true)} />
              <Button label={t.end} kind="quiet" onPress={() => setSession(emptySession())} />
            </View> : <>
              <View style={s.roundRow}><Text style={s.round}>{t.round} {String(session.round).padStart(2, '0')}</Text><View style={s.roundLine} /><Text style={s.round}>{t[profile.audience]}</Text></View>
              {session.ids.length === 1 ? <Text style={s.caption}>{t.oneOnly}</Text> : null}
              <View style={[s.outfits, singleColumn && { flexDirection: 'column' }]}>
                {session.ids.map((id, index) => <OutfitCard key={`${session.round}-${id}`} outfit={OUTFITS.find(o => o.id === id)!} index={index} locale={state.locale} ownedIds={state.ownedItemIds} vote={session.votes[id]} onVote={value => vote(id, value)} />)}
              </View>
              <View style={s.learning}><Icon name="heart" size={17} /><Text style={s.caption}>{t.learning}</Text></View>
              <Button label={t.next} kind="secondary" icon="arrow" onPress={() => nextPair()} />
              <Button label={t.end} kind="quiet" onPress={() => setSession(emptySession())} />
            </>}
            <Text style={s.demoFootnote}>{t.demoNote}</Text>
          </View> : tab === 'wardrobe' ? <Wardrobe state={state} profile={profile} onToggle={id => {
            setState(current => ({ ...current, ownedItemIds: current.ownedItemIds.includes(id) ? current.ownedItemIds.filter(item => item !== id) : [...current.ownedItemIds, id] })); setSession(emptySession());
          }} /> : <Profiles state={state} onSelect={selectProfile} onSave={saveProfile} onLanguage={changeLanguage}
            onAskReason={askReason => setState(current => ({ ...current, askReason }))} onReset={onReset} />}
        </>}
      </View>
    </ScrollView>
    {state.onboarded && !wide ? <View style={s.bottomNav}>{navigation}</View> : null}
    <Dialog visible={!!pendingReason} title={t.reasonTitle} closeLabel={t.skip} onClose={() => finishReason()}>
      <Text style={s.body}>{t.reasonBody}</Text>
      <Button kind="secondary" label={t.reasonStyle} onPress={() => finishReason('style')} />
      <Button kind="secondary" label={t.reasonColor} onPress={() => finishReason('color')} />
      <Button kind="secondary" label={t.reasonPrice} onPress={() => finishReason('price')} />
      <Button kind="quiet" label={t.skip} onPress={() => finishReason()} />
    </Dialog>
    <Dialog visible={editProfile} title={t.preferences} closeLabel={t.close} onClose={() => setEditProfile(false)}>
      {editProfile ? <ProfileForm key={profile.id} profile={profile} locale={state.locale} onSave={saveProfile} onCancel={() => setEditProfile(false)} /> : null}
    </Dialog>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, loading: { alignItems: 'center', justifyContent: 'center', gap: 20 },
  headerShell: { borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.background },
  header: { width: '100%', maxWidth: 1120, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 7 }, logo: { fontSize: 27, color: colors.plum, letterSpacing: -1.5, fontWeight: '800' },
  navigation: { flexDirection: 'row', gap: 6 }, bottomNav: { backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line },
  scroll: { flexGrow: 1, alignItems: 'center' }, content: { maxWidth: 760, width: '100%', padding: 20, paddingTop: 28, paddingBottom: 40 },
  headingBlock: { gap: 14, marginBottom: 25 }, headingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  eyebrow: { color: colors.muted, fontSize: 10, fontWeight: '600', letterSpacing: 1.6, textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -1.3, maxWidth: 620 },
  body: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  demoBadge: { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: colors.faint, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' },
  badgeText: { color: colors.plum, fontSize: 10, fontWeight: '500' }, dot: { width: 5, height: 5, borderRadius: 5, backgroundColor: colors.plum },
  preferences: { gap: 16 }, modes: { flexDirection: 'row', padding: 4, backgroundColor: '#EDE5E8', borderRadius: 16, gap: 5 },
  promptCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 24, padding: 25, gap: 19 },
  bigIcon: { width: 60, height: 60, borderRadius: 20, backgroundColor: colors.faint, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 25, fontWeight: '600', lineHeight: 31, letterSpacing: -0.7, color: colors.ink },
  outfits: { flexDirection: 'row', alignItems: 'stretch', gap: 12 },
  learning: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, caption: { color: colors.muted, fontSize: 12, lineHeight: 19, flexShrink: 1 },
  demoFootnote: { color: colors.muted, fontSize: 11, lineHeight: 18, textAlign: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line },
  roundRow: { flexDirection: 'row', gap: 12, alignItems: 'center' }, round: { color: colors.muted, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase' }, roundLine: { height: 1, backgroundColor: colors.line, flex: 1 },
  welcomeLayout: { gap: 32 }, welcomeIntro: { flex: 1, gap: 18 }, welcomeTitle: { fontSize: 44, lineHeight: 49, color: colors.plum, fontWeight: '700', letterSpacing: -2 },
  intro: { fontSize: 16, color: colors.muted, lineHeight: 25, maxWidth: 400 }, welcomePhotos: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', maxWidth: 430 },
  welcomePhoto: { flex: 1, aspectRatio: 2 / 3, borderRadius: 80, backgroundColor: colors.faint },
  welcomeImage: { width: '100%', height: '100%', borderRadius: 80 },
  welcomeForm: { flex: 1, gap: 24, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, borderRadius: 26, padding: 22, alignSelf: 'stretch' },
  banner: { padding: 14, backgroundColor: '#F2E6CE', borderRadius: 14, gap: 10, marginBottom: 18, color: colors.ink, fontSize: 13, lineHeight: 20 },
});
