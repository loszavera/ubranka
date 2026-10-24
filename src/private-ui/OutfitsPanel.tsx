import { useState } from 'react';
import { Text, View } from 'react-native';
import { OCCASIONS, type Locale, type Occasion } from '../domain/model';
import { copy } from '../i18n';
import { recommendPrivateOutfits, rehydratePrivateOutfit, swapPrivateOutfitItem, type PrivateOutfit, type PrivateRecommendations, type SavedPrivateOutfit } from '../private/outfits';
import type { usePrivateWardrobe } from '../private/usePrivateWardrobe';
import { Button, Chip, Dialog, Field, styles } from '../ui/Controls';
import { privateCopy, privateError } from './copy';
import { p33Copy } from './p33copy';
import { p33Styles as s } from './p33styles';
import { PrivatePhoto } from './PrivatePhoto';
import { VisualizationPreparation } from './VisualizationPanel';

type Api = ReturnType<typeof usePrivateWardrobe>;
function savedOutfit(outfit: PrivateOutfit): SavedPrivateOutfit {
  return { id: outfit.id, profileId: outfit.profileId, occasion: outfit.occasion, itemIds: [...outfit.itemIds], itemRevisions: { ...outfit.itemRevisions }, createdAt: new Date().toISOString() };
}

export function OutfitsPanel({ api, locale }: { api: Api; locale: Locale }) {
  const t = p33Copy(locale); const common = copy(locale); const wardrobe = privateCopy(locale);
  const snapshot = api.snapshot; const styling = snapshot?.styling;
  const [profileId, setProfileId] = useState(snapshot?.state.data.activeProfileId ?? '');
  const profile = snapshot?.state.data.profiles.find(value => value.id === profileId);
  const [occasion, setOccasion] = useState<Occasion>(profile?.occasion ?? 'casual');
  const [round, setRound] = useState<{ key: string; recommendations: PrivateRecommendations; seen: string[] }>();
  const [swap, setSwap] = useState<{ outfit: PrivateOutfit; itemId: string } | null>(null);
  const [visual, setVisual] = useState<PrivateOutfit | null>(null);
  const [rejecting, setRejecting] = useState<PrivateOutfit | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  if (!snapshot || !styling) return <Text style={s.body}>{t.unavailable}</Text>;
  const key = JSON.stringify([profile, occasion, snapshot.bodyFit?.data.topSize, snapshot.bodyFit?.data.bottomSize]);
  const currentRound = round?.key === key ? round : undefined;
  const getCurrent = (saved: SavedPrivateOutfit) => {
    const ownerProfile = snapshot.state.data.profiles.find(value => value.id === saved.profileId);
    return ownerProfile ? rehydratePrivateOutfit({ savedOutfit: saved, accountId: snapshot.accountId, items: snapshot.items, profile: ownerProfile, bodyFit: snapshot.bodyFit?.data }).outfit : null;
  };
  const find = () => {
    if (!profile || api.busy) return;
    const seen = currentRound?.seen ?? [];
    const recommendations = recommendPrivateOutfits({ accountId: snapshot.accountId, items: snapshot.items, profile, occasion, feedback: styling.data.feedback, excludeIds: seen, bodyFit: snapshot.bodyFit?.data });
    setRound({ key, recommendations, seen: [...seen, ...recommendations.outfits.map(outfit => outfit.id)] });
    setError(''); setNotice('');
  };
  const persist = async (outfits: SavedPrivateOutfit[], feedback = styling.data.feedback) => {
    try { await api.saveStyling({ outfits, feedback }, styling.revision); setNotice(t.saved); setError(''); return true; }
    catch (issue) { setError(privateError(locale, issue)); return false; }
  };
  const vote = async (outfit: PrivateOutfit, value: 'like' | 'dislike', why?: string) => {
    const feedback = [...styling.data.feedback.filter(entry => entry.profileId !== outfit.profileId || entry.outfitId !== outfit.id), {
      profileId: outfit.profileId, outfitId: outfit.id, itemIds: [...outfit.itemIds], vote: value, ...(why?.trim() ? { reason: why.trim() } : {}),
    }];
    if (await persist(styling.data.outfits, feedback)) setRejecting(null);
  };
  const card = (original: PrivateOutfit, stored: boolean) => {
    const outfit = getCurrent(savedOutfit(original));
    if (!outfit) return <View key={original.id} style={s.warning}><Text style={s.body}>{t.staleOutfit}</Text></View>;
    const existingVote = styling.data.feedback.find(value => value.profileId === outfit.profileId && value.outfitId === outfit.id)?.vote;
    return <View key={outfit.id} style={s.card}>
      <Text accessibilityRole="header" style={s.title}>{common[outfit.occasion]} · {t.noNewSpend}</Text>
      <View style={styles.row}>{outfit.itemIds.map(id => {
        const item = snapshot.items.find(value => value.id === id)!;
        return <View key={id} style={s.small}>
          {item.photo ? <PrivatePhoto path={item.photo.thumbPath} api={api} locale={locale} label={item.name} height={150} /> : null}
          <Text style={s.body}>{item.name}</Text><Text style={s.note}>{wardrobe.categories[item.category]} · {item.color}{item.size ? ` · ${item.size}` : ''}</Text>
          <Button label={`${t.swap}: ${item.name}`} compact kind="quiet" disabled={api.busy} onPress={() => { setSwap({ outfit, itemId: id }); setError(''); }} />
        </View>;
      })}</View>
      <Text style={s.note}>{outfit.reasons.map(code => t.reasons[code]).join(' · ')}</Text>
      <View style={styles.row}><Chip label={t.like} selected={existingVote === 'like'} disabled={api.busy} onPress={() => { void vote(outfit, 'like'); }} />
        <Chip label={t.dislike} selected={existingVote === 'dislike'} disabled={api.busy} onPress={() => { if (snapshot.state.data.askReason) { setRejecting(outfit); setReason(''); } else void vote(outfit, 'dislike'); }} /></View>
      {!stored ? <Button label={t.saveOutfit} kind="secondary" disabled={api.busy || styling.data.outfits.some(value => value.id === outfit.id)} onPress={() => { void persist([...styling.data.outfits, savedOutfit(outfit)]); }} /> : null}
      <Button label={t.prepareVisual} disabled={api.busy} onPress={() => setVisual(outfit)} />
      {stored ? <Button label={t.removeOutfit} kind="quiet" disabled={api.busy} onPress={() => { void persist(styling.data.outfits.filter(value => value.id !== outfit.id)); }} /> : null}
    </View>;
  };
  const replacementSource = swap ? snapshot.items.find(item => item.id === swap.itemId) : null;
  const replacements = swap && replacementSource ? snapshot.items.filter(item => item.status === 'active' && item.category === replacementSource.category && item.occasions.includes(swap.outfit.occasion) && !swap.outfit.itemIds.includes(item.id)) : [];
  return <View style={s.stack}>
    <View style={s.card}><Text accessibilityRole="header" style={s.title}>{t.outfits}</Text><Text style={s.body}>{t.outfitIntro}</Text>
      <Text style={styles.label}>{t.chooseProfile}</Text><View style={styles.row}>{snapshot.state.data.profiles.map(value => <Chip key={value.id} label={value.name} selected={profileId === value.id} disabled={api.busy} onPress={() => { setProfileId(value.id); setOccasion(value.occasion); setRound(undefined); setVisual(null); setNotice(''); }} />)}</View>
      {!profile ? <Text style={s.note}>{t.noProfile}</Text> : null}
      <Text style={styles.label}>{t.chooseOccasion}</Text><View style={styles.row}>{OCCASIONS.map(value => <Chip key={value} label={common[value]} selected={occasion === value} disabled={api.busy} onPress={() => { setOccasion(value); setRound(undefined); setNotice(''); }} />)}</View>
      <Button label={currentRound ? t.nextPair : t.find} disabled={!profile || api.busy} onPress={find} />
      <Text style={s.note}>{t.noPriceMode}</Text><Text style={s.note}>{t.fitCaveat}</Text>
    </View>
    {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}{notice ? <Text accessibilityLiveRegion="polite" style={s.note}>{notice}</Text> : null}
    {currentRound?.recommendations.sizeExcluded ? <Text style={s.note}>{t.sizeExcluded}: {currentRound.recommendations.sizeExcluded}</Text> : null}
    {currentRound && !currentRound.recommendations.outfits.length ? <View style={s.card}><Text style={s.body}>{t.noOutfits}</Text>
      {currentRound.recommendations.missingAlternatives.map(alternative => <Text key={alternative.kind} style={s.note}>{t[alternative.kind]} — {t.missingParts}: {alternative.categories.map(category => wardrobe.categories[category]).join(', ')}</Text>)}
    </View> : null}
    {currentRound?.recommendations.outfits.map(outfit => card(outfit, false))}
    <Text accessibilityRole="header" style={s.title}>{t.savedOutfits} · {styling.data.outfits.length}/100</Text>
    {!styling.data.outfits.length ? <Text style={s.body}>{t.noSaved}</Text> : null}
    {styling.data.outfits.map(saved => {
      const outfit = getCurrent(saved);
      return outfit ? card(outfit, true) : <View key={saved.id} style={s.warning}><Text style={s.body}>{t.staleOutfit}</Text><Button label={t.removeOutfit} kind="quiet" disabled={api.busy} onPress={() => { void persist(styling.data.outfits.filter(value => value.id !== saved.id)); }} /></View>;
    })}
    <Dialog visible={!!swap} title={t.chooseReplacement} closeLabel={t.cancel} onClose={() => setSwap(null)}>
      {!replacements.length ? <Text style={s.body}>{t.noReplacement}</Text> : null}
      {replacements.map(item => <Button key={item.id} label={item.name} disabled={api.busy} kind="secondary" onPress={() => {
        if (!swap) return;
        const targetProfile = snapshot.state.data.profiles.find(value => value.id === swap.outfit.profileId); if (!targetProfile) return;
        try {
          const outfit = swapPrivateOutfitItem({ ...swap, replacementId: item.id, items: snapshot.items, profile: targetProfile, feedback: styling.data.feedback, bodyFit: snapshot.bodyFit?.data });
          const nextKey = JSON.stringify([targetProfile, outfit.occasion, snapshot.bodyFit?.data.topSize, snapshot.bodyFit?.data.bottomSize]);
          setProfileId(targetProfile.id); setOccasion(outfit.occasion);
          setRound({ key: nextKey, seen: [...(currentRound?.seen ?? []), outfit.id], recommendations: { outfits: [outfit], missingAlternatives: [], notices: [], sizeExcluded: 0 } }); setSwap(null); setNotice('');
        } catch (issue) { setError(privateError(locale, issue)); }
      }} />)}{error ? <Text style={s.error}>{error}</Text> : null}
    </Dialog>
    <Dialog visible={!!rejecting} title={t.reason} closeLabel={t.cancel} onClose={() => { if (!api.busy) setRejecting(null); }}>
      <Field label={t.reason} value={reason} onChangeText={setReason} maxLength={200} editable={!api.busy} />
      <Button label={t.confirmVote} disabled={api.busy} onPress={() => { if (rejecting) void vote(rejecting, 'dislike', reason); }} />
      <Button label={t.skipReason} disabled={api.busy} kind="quiet" onPress={() => { if (rejecting) void vote(rejecting, 'dislike'); }} />{error ? <Text style={s.error}>{error}</Text> : null}
    </Dialog>
    <Dialog visible={!!visual} title={t.visualTitle} closeLabel={t.cancel} onClose={() => setVisual(null)}>{visual ? <VisualizationPreparation key={visual.id} outfit={visual} api={api} locale={locale} /> : null}</Dialog>
  </View>;
}
