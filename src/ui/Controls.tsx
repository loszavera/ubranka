import { useState, type ReactNode } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors } from './theme';
import { Icon, type IconName } from './Icon';

export function Button({ label, onPress, kind = 'primary', icon, disabled = false, selected, compact = false, testID }: {
  label: string; onPress: () => void; kind?: 'primary'|'secondary'|'quiet'; icon?: IconName;
  disabled?: boolean; selected?: boolean; compact?: boolean; testID?: string;
}) {
  const [focused, setFocused] = useState(false);
  const foreground = kind === 'primary' ? colors.white : colors.plum;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled, selected }}
    {...(Platform.OS === 'web' && selected !== undefined ? { 'aria-pressed': selected } : {})}
    testID={testID} disabled={disabled} onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={({ pressed }) => [styles.button, kind === 'primary' ? styles.primary : kind === 'secondary' ? styles.secondary : styles.quiet,
      compact && styles.compact, focused && styles.focus, pressed && styles.pressed, disabled && styles.disabled]}>
    {icon ? <Icon name={icon} size={compact ? 18 : 20} color={foreground} /> : null}
    <Text style={[styles.buttonText, { color: foreground }, compact && { fontSize: 13 }]}>{label}</Text>
  </Pressable>;
}

export function Chip({ label, selected, onPress, icon, accessibilityLabel, disabled = false }: { label: string; selected?: boolean; onPress: () => void; icon?: IconName; accessibilityLabel?: string; disabled?: boolean }) {
  const [focused, setFocused] = useState(false);
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress}
    {...(Platform.OS === 'web' && selected !== undefined ? { 'aria-pressed': selected } : {})}
    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={({ pressed }) => [styles.chip, selected && styles.chipSelected, focused && styles.focus, pressed && styles.pressed, disabled && styles.disabled]}>
    {icon ? <Icon name={icon} size={17} color={selected ? colors.white : colors.plum} /> : null}
    <Text style={[styles.chipText, selected && { color: colors.white }]}>{label}</Text>
  </Pressable>;
}

export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  const [focused, setFocused] = useState(false);
  return <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput accessibilityLabel={label} placeholderTextColor={colors.muted} {...props}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={[styles.input, focused && styles.focus, error ? { borderColor: colors.error } : null]} />
    {error ? <Text accessibilityRole="alert" style={{ color: colors.error, fontSize: 13 }}>{error}</Text> : null}
  </View>;
}

export function Dialog({ visible, title, closeLabel, onClose, children }: {
  visible: boolean; title: string; closeLabel: string; onClose: () => void; children: ReactNode;
}) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.overlay}>
      <View accessibilityViewIsModal style={styles.dialog}>
        <ScrollView contentContainerStyle={{ gap: 18, padding: 24 }} keyboardShouldPersistTaps="handled">
          <View style={styles.row}><Text accessibilityRole="header" style={styles.dialogTitle}>{title}</Text>
            <Button label={closeLabel} kind="quiet" onPress={onClose} compact icon="close" /></View>
          {children}
        </ScrollView>
      </View>
    </View>
  </Modal>;
}

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  button: { minHeight: 48, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, borderWidth: 2, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: colors.plum, borderColor: colors.plum },
  secondary: { backgroundColor: colors.surface, borderColor: colors.line },
  quiet: { backgroundColor: 'transparent', borderColor: 'transparent' },
  compact: { minHeight: 44, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12 },
  buttonText: { fontSize: 15, fontWeight: '600', flexShrink: 1, textAlign: 'center' },
  focus: { borderColor: colors.focus }, pressed: { opacity: 0.78 }, disabled: { opacity: 0.55 },
  chip: { minHeight: 44, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 30, borderWidth: 2, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  chipSelected: { borderColor: colors.plum, backgroundColor: colors.plum },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.plum, flexShrink: 1 },
  field: { gap: 8 }, label: { fontSize: 13, fontWeight: '600', color: colors.ink },
  input: { minHeight: 50, borderWidth: 2, borderColor: colors.line, borderRadius: 13, color: colors.ink, padding: 12, backgroundColor: colors.surface, fontSize: 16 },
  overlay: { flex: 1, backgroundColor: 'rgba(40,26,36,0.35)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  dialog: { maxWidth: 500, width: '100%', maxHeight: '90%', backgroundColor: colors.background, borderRadius: 25, overflow: 'hidden' },
  dialogTitle: { flex: 1, fontSize: 24, fontWeight: '700', color: colors.ink, letterSpacing: -0.7 },
});
