import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BASE, UNIVERSITY_LIST, withAlpha, type UniversityId } from '@/constants/universities';
import { useGame } from '@/context/GameContext';

export default function TeamSelectionScreen() {
  const { university, selectUniversity } = useGame();
  const [choice, setChoice] = useState<UniversityId | null>(null);
  const insets = useSafeAreaInsets();

  if (university) return <Redirect href="/(tabs)/map" />;

  const selected = UNIVERSITY_LIST.find((u) => u.id === choice) ?? null;
  const accent = selected?.primary ?? '#334155';

  const confirm = () => {
    if (!choice) return;
    selectUniversity(choice);
    router.replace('/(tabs)/map');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.badge, { backgroundColor: withAlpha(accent, 0.12) }]}>
          <Ionicons name="flag" size={16} color={accent} />
          <Text style={[styles.badgeText, { color: accent }]}>Temporada 1 · Barcelona</Text>
        </View>
        <Text style={styles.title}>Campus{'\n'}Conquerors</Text>
        <Text style={styles.subtitle}>
          Elige tu facción. Corre por la ciudad, despeja la niebla y pinta las calles con el color de
          tu universidad.
        </Text>

        <View style={styles.grid}>
          {UNIVERSITY_LIST.map((u) => {
            const active = u.id === choice;
            return (
              <Pressable
                key={u.id}
                onPress={() => setChoice(u.id)}
                style={({ pressed }) => [
                  styles.card,
                  active && { borderColor: u.primary, backgroundColor: withAlpha(u.primary, 0.06) },
                  pressed && { transform: [{ scale: 0.98 }] },
                ]}
              >
                <View style={[styles.swatch, { backgroundColor: u.primary }]}>
                  <View style={[styles.swatchNeon, { backgroundColor: u.neon }]} />
                  <Text style={styles.swatchLabel}>{u.shortName}</Text>
                </View>
                <Text style={styles.cardName}>{u.name}</Text>
                <Text style={styles.cardMotto}>{u.motto}</Text>
                {active && (
                  <View style={[styles.check, { backgroundColor: u.primary }]}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          disabled={!choice}
          onPress={confirm}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: accent, opacity: !choice ? 0.4 : pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.ctaText}>
            {selected ? `Representar a la ${selected.shortName}` : 'Selecciona una universidad'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BASE.background },
  scroll: { paddingHorizontal: 24, paddingBottom: 24 },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 16,
  },
  badgeText: { fontWeight: '700', fontSize: 12, letterSpacing: 0.5 },
  title: { fontSize: 44, lineHeight: 46, fontWeight: '900', color: BASE.text, letterSpacing: -1 },
  subtitle: { marginTop: 12, fontSize: 15, lineHeight: 22, color: BASE.textMuted },
  grid: { marginTop: 28, gap: 12 },
  card: {
    backgroundColor: BASE.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: BASE.border,
    flexDirection: 'column',
    gap: 4,
  },
  swatch: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  swatchNeon: {
    position: 'absolute',
    right: -14,
    bottom: -14,
    width: 40,
    height: 40,
    borderRadius: 20,
    opacity: 0.85,
  },
  swatchLabel: { color: '#fff', fontWeight: '900', fontSize: 16 },
  cardName: { fontSize: 16, fontWeight: '700', color: BASE.text },
  cardMotto: { fontSize: 13, color: BASE.textMuted },
  check: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: BASE.background,
    borderTopWidth: 1,
    borderTopColor: BASE.border,
  },
  cta: {
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
