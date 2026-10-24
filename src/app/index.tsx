import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [previewChecked, setPreviewChecked] = useState(false);
  const [buttonFocused, setButtonFocused] = useState(false);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.brand}>
            <View style={styles.brandMark} accessible={false}>
              <Text style={styles.brandInitial}>u.</Text>
            </View>
            <Text style={styles.brandName}>ubranka</Text>
          </View>

          <View style={styles.hero}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Wersja przygotowawcza</Text>
            </View>
            <Text accessibilityRole="header" style={styles.heading}>
              Twój styl.{'\n'}Mniej decyzji.
            </Text>
            <Text style={styles.introduction}>
              Tworzymy wirtualnego stylistę, który pomoże znaleźć ubrania i zestawy
              pasujące do Ciebie.
            </Text>
          </View>

          <View style={styles.ideas}>
            <Text style={styles.eyebrow}>OD TEGO ZACZYNAMY</Text>
            <View style={styles.card}>
              <Text style={styles.cardNumber}>01</Text>
              <View style={styles.cardContent}>
                <Text accessibilityRole="header" style={styles.cardTitle}>
                  Dwie opcje. Prosty wybór.
                </Text>
                <Text style={styles.cardDescription}>
                  Pomysł: propozycje zgodne z Twoim stylem i budżetem. Ty wybierasz
                  „tak” lub „nie”.
                </Text>
              </View>
            </View>
            <View style={[styles.card, styles.wardrobeCard]}>
              <Text style={styles.cardNumber}>02</Text>
              <View style={styles.cardContent}>
                <Text accessibilityRole="header" style={styles.cardTitle}>
                  Twoja szafa, nowe zestawy.
                </Text>
                <Text style={styles.cardDescription}>
                  Pomysł: łączymy nowe znaleziska z ubraniami, które już masz.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.preview}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sprawdź podgląd"
              accessibilityHint="Wyświetla potwierdzenie działania przycisku."
              onPress={() => setPreviewChecked(true)}
              onFocus={() => setButtonFocused(true)}
              onBlur={() => setButtonFocused(false)}
              style={({ pressed }) => [
                styles.button,
                buttonFocused && styles.buttonFocused,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.buttonText}>Sprawdź podgląd</Text>
              <Text style={styles.buttonArrow} accessible={false}>
                ↗
              </Text>
            </Pressable>
            <Text accessibilityLiveRegion="polite" style={styles.previewMessage}>
              {previewChecked
                ? 'Podgląd działa — możemy zaczynać.'
                : 'Sprawdź, jak ekran działa na Twoim urządzeniu.'}
            </Text>
          </View>

          <Text style={styles.footer}>
            Na razie poznajemy kierunek. Funkcje stylisty powstaną w kolejnych
            krokach.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F3EE' },
  scrollContent: { flexGrow: 1, alignItems: 'center' },
  content: {
    width: '100%',
    maxWidth: 520,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 28,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: '#553C50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandInitial: { color: '#FFFFFF', fontWeight: '700', fontSize: 24 },
  brandName: { color: '#29252C', fontWeight: '700', fontSize: 23, letterSpacing: -0.7 },
  hero: { marginTop: 40, marginBottom: 32 },
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 20,
    backgroundColor: '#EAE0E7',
    marginBottom: 20,
  },
  badgeText: { color: '#553C50', fontSize: 12, fontWeight: '600' },
  heading: {
    color: '#29252C',
    fontSize: 44,
    lineHeight: 49,
    letterSpacing: -1.8,
    fontWeight: '700',
    marginBottom: 16,
  },
  introduction: { color: '#655D65', fontSize: 17, lineHeight: 26 },
  ideas: { gap: 12 },
  eyebrow: {
    color: '#70636D',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  card: {
    flexDirection: 'row',
    gap: 14,
    padding: 19,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4D8DD',
    backgroundColor: '#F1E8EC',
  },
  wardrobeCard: { backgroundColor: '#EDEDE5', borderColor: '#DDDED2' },
  cardNumber: { color: '#776773', fontSize: 12, fontWeight: '700', paddingTop: 4 },
  cardContent: { flex: 1, gap: 7 },
  cardTitle: { color: '#342C35', fontSize: 17, lineHeight: 23, fontWeight: '600' },
  cardDescription: { color: '#655D65', fontSize: 14, lineHeight: 21 },
  preview: { marginTop: 28, gap: 12 },
  button: {
    minHeight: 58,
    paddingVertical: 13,
    paddingHorizontal: 19,
    backgroundColor: '#553C50',
    borderColor: '#553C50',
    borderWidth: 3,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  buttonFocused: { borderColor: '#C39635' },
  buttonPressed: { backgroundColor: '#382734', transform: [{ scale: 0.985 }] },
  buttonText: { flexShrink: 1, color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  buttonArrow: { color: '#F1E2EB', fontSize: 23, lineHeight: 26 },
  previewMessage: { color: '#655D65', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  footer: {
    color: '#756C73',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 30,
    paddingHorizontal: 8,
  },
});
