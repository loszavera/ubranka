import { Text, View } from 'react-native';
import { OCCASIONS, type Locale, type Occasion } from '../domain/model';
import { copy } from '../i18n';
import { Chip, styles } from './Controls';
import { colors } from './theme';

export function OccasionPicker({ value, locale, onChange, scope }: {
  value: Occasion; locale: Locale; onChange: (value: Occasion) => void;
  scope: 'round' | 'profile' | 'onboarding';
}) {
  const t = copy(locale);
  const label = scope === 'profile' ? t.defaultOccasion : scope === 'round' ? t.roundOccasion : t.occasion;
  return <View testID={`occasion-${scope}`} style={{ gap: 10 }}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.row}>{OCCASIONS.map(occasion => <Chip key={occasion}
      label={t[occasion]} accessibilityLabel={`${label}: ${t[occasion]}`}
      selected={value === occasion} onPress={() => onChange(occasion)} />)}</View>
    {scope === 'round' ? <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>{t.roundOccasionHelp}</Text> : null}
  </View>;
}
