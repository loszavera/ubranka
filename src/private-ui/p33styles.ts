import { StyleSheet } from 'react-native';
import { colors } from '../ui/theme';
export const p33Styles = StyleSheet.create({
  stack: { gap: 18 }, card: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 22, padding: 20, gap: 16 },
  title: { color: colors.ink, fontSize: 22, fontWeight: '600', lineHeight: 29 }, body: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  note: { color: colors.muted, fontSize: 12, lineHeight: 19 }, error: { color: colors.error, fontSize: 14, lineHeight: 22 },
  warning: { backgroundColor: '#F2E6CE', padding: 18, borderRadius: 16, gap: 12 },
  image: { width: '100%', height: 280, borderRadius: 16 }, small: { flex: 1, minWidth: 130, gap: 10 },
});
