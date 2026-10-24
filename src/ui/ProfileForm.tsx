import { useState } from 'react';
import { Text, View } from 'react-native';
import type { Locale, Profile } from '../domain/model';
import { copy } from '../i18n';
import { Button, Chip, Field, styles } from './Controls';
import { colors } from './theme';

export function ProfileForm({ profile, locale, onSave, onCancel, welcome = false }: {
  profile: Profile; locale: Locale; onSave: (profile: Profile) => void; onCancel?: () => void; welcome?: boolean;
}) {
  const t = copy(locale);
  const [draft, setDraft] = useState(profile);
  const [budget, setBudget] = useState(String(profile.budget));
  const [submitted, setSubmitted] = useState(false);
  const numericBudget = Number(budget.trim().replace(',', '.'));
  const validBudget = budget.trim() !== '' && Number.isFinite(numericBudget) && numericBudget >= 0 && numericBudget <= 10000;
  const validName = draft.name.trim().length > 0 && draft.name.trim().length <= 40;
  const submit = () => {
    setSubmitted(true);
    if (validBudget && (welcome || validName)) onSave({ ...draft, name: welcome ? t[draft.occasion] : draft.name.trim(), budget: numericBudget });
  };
  return <View style={{ gap: 22 }}>
    {!welcome ? <Field label={t.profileName} value={draft.name} onChangeText={name => setDraft({ ...draft, name })} maxLength={40} error={submitted && !validName ? t.nameError : undefined} /> : null}
    <View style={{ gap: 10 }}><Text style={styles.label}>{t.clothing}</Text><View style={styles.row}>
      {(['women', 'men'] as const).map(audience => <Chip key={audience} label={t[audience]} selected={draft.audience === audience} onPress={() => setDraft({ ...draft, audience })} />)}
    </View></View>
    <View style={{ gap: 10 }}><Text style={styles.label}>{t.occasion}</Text><View style={styles.row}>
      {(['casual', 'elegant'] as const).map(occasion => <Chip key={occasion} label={t[occasion]} selected={draft.occasion === occasion} onPress={() => setDraft({ ...draft, occasion })} />)}
    </View></View>
    <View style={{ gap: 7 }}>
      <Field label={`${t.budget} · PLN`} value={budget} keyboardType="decimal-pad" onChangeText={setBudget} maxLength={8} error={submitted && !validBudget ? t.budgetError : undefined} />
      <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>{t.budgetHelp}</Text>
    </View>
    {!welcome ? <>
      <View style={{ gap: 10 }}><Text style={styles.label}>{t.priority}</Text><View style={styles.row}>
        {(['comfort', 'quality', 'versatility'] as const).map(priority => <Chip key={priority} label={t[priority]} selected={draft.priority === priority} onPress={() => setDraft({ ...draft, priority })} />)}
      </View></View>
      <View style={{ gap: 10 }}><Text style={styles.label}>{t.defaultMode}</Text><View style={styles.row}>
        {(['best', 'value'] as const).map(defaultMode => <Chip key={defaultMode} label={t[defaultMode]} selected={draft.defaultMode === defaultMode} onPress={() => setDraft({ ...draft, defaultMode })} />)}
      </View></View>
    </> : null}
    <Button label={welcome ? t.start : t.save} onPress={submit} icon="arrow" />
    {onCancel ? <Button label={t.cancel} kind="quiet" onPress={onCancel} /> : null}
  </View>;
}
