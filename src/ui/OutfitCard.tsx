import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { Locale, Outfit } from '../domain/model';
import { ITEMS } from '../domain/catalog';
import { costOfOutfit } from '../domain/recommendations';
import { copy, money } from '../i18n';
import { Button } from './Controls';
import { Icon } from './Icon';
import { colors } from './theme';

export const outfitImages = {
  w1: require('../../assets/outfits/w1.png'), w2: require('../../assets/outfits/w2.png'),
  w3: require('../../assets/outfits/w3.png'), w4: require('../../assets/outfits/w4.png'),
  m1: require('../../assets/outfits/m1.png'), m2: require('../../assets/outfits/m2.png'),
  m3: require('../../assets/outfits/m3.png'), m4: require('../../assets/outfits/m4.png'),
  w5: require('../../assets/outfits/w5.png'), w6: require('../../assets/outfits/w6.png'),
  m5: require('../../assets/outfits/m5.png'), m6: require('../../assets/outfits/m6.png'),
};

export function OutfitCard({ outfit, locale, ownedIds, vote, onVote, index }: {
  outfit: Outfit; locale: Locale; ownedIds: string[]; vote?: 'like'|'dislike';
  onVote: (vote: 'like'|'dislike') => void; index: number;
}) {
  const t = copy(locale);
  const [expanded, setExpanded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [imageAttempt, setImageAttempt] = useState(0);
  const cost = costOfOutfit(outfit, ownedIds);
  return <View testID={`outfit-${outfit.id}`} style={s.card}>
    <View style={s.imageWrap}>
      {failed ? <View style={s.imageFallback}><Icon name="hanger" size={40} /><Text style={s.small}>{t.imageError}</Text><Button compact kind="secondary" label={t.retry} onPress={() => { setFailed(false); setImageAttempt(n => n + 1); }} /></View>
        : <Image key={imageAttempt} source={outfitImages[outfit.imageKey]} style={s.image} resizeMode="cover" onError={() => setFailed(true)} accessibilityLabel={`${t.outfit} ${index + 1}: ${outfit.description[locale]}`} />}
      <View style={s.imageNumber}><Text style={s.number}>{String(index + 1).padStart(2, '0')}</Text></View>
      {cost.ownedCount > 0 ? <View style={s.ownedBadge}><Icon name="wardrobe" size={12} color={colors.sageInk} /><Text style={s.ownedText}>{t.owned} · {cost.ownedCount}</Text></View> : null}
    </View>
    <View style={s.body}>
      <Text style={s.tier}>{t[outfit.tier]}</Text>
      <Text accessibilityRole="header" style={s.title}>{outfit.name[locale]}</Text>
      <Text style={s.price}>{cost.total === null ? t.unknown : money(cost.total, locale)}</Text>
      <Text style={s.small}>{t.newExpense} + {t.delivery.toLocaleLowerCase(locale)}</Text>
      <View style={s.pieces}>
        {outfit.itemIds.map(id => { const item = ITEMS.find(i => i.id === id)!; return <View key={id} style={[s.piece, ownedIds.includes(id) && s.ownedPiece]} accessibilityLabel={item.name[locale]} accessible>
          <Icon name={item.category} fillColor={item.color} size={25} />
        </View>; })}
      </View>
      <Button kind="quiet" compact label={expanded ? t.hideDetails : t.details} onPress={() => setExpanded(!expanded)} />
      {expanded ? <View style={s.details}>
        {outfit.itemIds.map(id => { const item = ITEMS.find(i => i.id === id)!; return <View key={id} style={s.costRow}>
          <Text style={[s.small, { flex: 1 }]}>{item.name[locale]}{ownedIds.includes(id) ? ` · ${t.owned}` : ''}</Text>
          <Text style={s.small}>{money(ownedIds.includes(id) ? 0 : item.price, locale)}</Text>
        </View>; })}
        <View style={s.costRow}><Text style={s.small}>{t.delivery}</Text><Text style={s.small}>{cost.total === null ? t.unknown : money(cost.shipping, locale)}</Text></View>
      </View> : null}
      <View style={s.votes}>
        <View style={{ flex: 1 }}><Button compact kind="secondary" icon="close" label={t.dislike} disabled={!!vote} onPress={() => onVote('dislike')} /></View>
        <View style={{ flex: 1 }}><Button compact icon="heart" label={t.like} disabled={!!vote} onPress={() => onVote('like')} /></View>
      </View>
      {vote ? <Text accessibilityLiveRegion="polite" style={s.voteLabel}>{vote === 'like' ? t.liked : t.disliked}</Text> : null}
    </View>
  </View>;
}
const s = StyleSheet.create({
  card: { flex: 1, minWidth: 0, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  imageWrap: { aspectRatio: 2 / 3, backgroundColor: '#E9E3DB' }, image: { width: '100%', height: '100%' },
  imageFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 12 },
  imageNumber: { position: 'absolute', top: 12, left: 12, borderRadius: 20, width: 30, height: 30, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  number: { fontSize: 11, color: colors.plum, fontWeight: '700' },
  ownedBadge: { position: 'absolute', bottom: 10, left: 8, right: 8, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, padding: 7, borderRadius: 8, backgroundColor: colors.sage },
  ownedText: { fontSize: 10, color: colors.sageInk, flexShrink: 1, fontWeight: '600' },
  body: { padding: 12, gap: 5 }, tier: { fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: colors.muted },
  title: { fontSize: 17, lineHeight: 22, color: colors.ink, fontWeight: '600', letterSpacing: -0.4, minHeight: 44 },
  price: { fontSize: 21, color: colors.ink, fontWeight: '700', letterSpacing: -0.5 },
  small: { fontSize: 11, color: colors.muted, lineHeight: 16 }, pieces: { flexDirection: 'row', gap: 5, marginTop: 8 },
  piece: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: '#F1ECE7' },
  ownedPiece: { borderWidth: 1, borderColor: '#98A38E' },
  votes: { flexDirection: 'column', gap: 6, marginTop: 4 }, voteLabel: { fontSize: 12, color: colors.plum, fontWeight: '600', textAlign: 'center', marginTop: 5 },
  details: { gap: 9, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.line }, costRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 5 },
});
