import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AppState, Profile } from '../domain/model';
import { ITEMS } from '../domain/catalog';
import { copy, money } from '../i18n';
import { Button, Chip, styles } from './Controls';
import { Icon } from './Icon';
import { colors } from './theme';

export function Wardrobe({ state, profile, onToggle }: { state: AppState; profile: Profile; onToggle: (id: string) => void }) {
  const t = copy(state.locale);
  const [onlyOwned, setOnlyOwned] = useState(false);
  const items = ITEMS.filter(item => item.audience === profile.audience && (!onlyOwned || state.ownedItemIds.includes(item.id)));
  return <View style={{ gap: 24 }}>
    <View style={styles.row}>
      <Chip label={t.all} selected={!onlyOwned} onPress={() => setOnlyOwned(false)} />
      <Chip label={t.mine} selected={onlyOwned} onPress={() => setOnlyOwned(true)} />
      <Text style={s.hint}>{t[profile.audience]} · {items.length}</Text>
    </View>
    {items.length ? <View style={s.grid}>{items.map(item => {
      const owned = state.ownedItemIds.includes(item.id);
      return <View testID={`wardrobe-${item.id}`} style={s.card} key={item.id}>
        <View style={[s.illustration, owned && { backgroundColor: colors.sage }]}>
          <Icon name={item.category} size={64} fillColor={item.color} />
          {owned ? <View style={s.check}><Icon name="check" size={15} color={colors.sageInk} /></View> : null}
        </View>
        <View style={s.body}>
          <Text style={s.category}>{t[item.category]}</Text>
          <Text style={s.name}>{item.name[state.locale]}</Text>
          <Text style={s.hint}>{owned ? t.owned : money(item.price, state.locale)}</Text>
          <Button label={owned ? t.removeOwned : t.ownAction} compact kind="secondary" icon={owned ? 'check' : 'plus'} onPress={() => onToggle(item.id)} />
        </View>
      </View>;
    })}</View> : <View style={s.empty}><Icon name="wardrobe" size={40} /><Text style={s.name}>{t.emptyWardrobe}</Text><Text style={s.hint}>{t.emptyWardrobeBody}</Text></View>}
    <Text style={s.note}>{t.wardrobePhoto}</Text>
  </View>;
}
const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, card: { width: '48%', flexGrow: 1, maxWidth: '50%', backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  illustration: { height: 132, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEE7DF' },
  check: { position: 'absolute', top: 10, right: 10, width: 25, height: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderRadius: 15 },
  body: { padding: 12, gap: 8 }, category: { color: colors.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  name: { color: colors.ink, fontSize: 16, fontWeight: '600', lineHeight: 21 }, hint: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  empty: { backgroundColor: colors.surface, padding: 28, borderRadius: 20, gap: 16 },
  note: { color: colors.muted, fontSize: 13, lineHeight: 21, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 20 },
});
