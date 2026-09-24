import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { withAlpha } from '@/constants/universities';

type Props = { primary: string; neon: string; onPrimary: string };

/** The season finale: an official 5 km race with a 1 h cut-off. */
export const UNIRUN_DATE = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 23);
  d.setHours(9, 0, 0, 0);
  return d;
})();

function splitCountdown(target: Date, now: number) {
  const total = Math.max(0, target.getTime() - now);
  const days = Math.floor(total / 86_400_000);
  const hours = Math.floor((total % 86_400_000) / 3_600_000);
  const minutes = Math.floor((total % 3_600_000) / 60_000);
  const seconds = Math.floor((total % 60_000) / 1000);
  return { days, hours, minutes, seconds };
}

export function UniRunBanner({ primary, neon, onPrimary }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const [shimmer] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const { days, hours, minutes, seconds } = splitCountdown(UNIRUN_DATE, now);
  const glowOpacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.7] });

  return (
    <View style={[styles.card, { backgroundColor: primary }]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.glow, { backgroundColor: neon, opacity: glowOpacity }]}
      />
      <View style={styles.headerRow}>
        <View style={[styles.tag, { backgroundColor: withAlpha('#FFFFFF', 0.18) }]}>
          <Ionicons name="flash" size={12} color={onPrimary} />
          <Text style={[styles.tagText, { color: onPrimary }]}>GRAN FINAL</Text>
        </View>
        <Text style={[styles.date, { color: withAlpha(onPrimary, 0.85) }]}>
          {UNIRUN_DATE.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} · 09:00
        </Text>
      </View>
      <Text style={[styles.title, { color: onPrimary }]}>UniRun Barcelona</Text>
      <Text style={[styles.subtitle, { color: withAlpha(onPrimary, 0.9) }]}>
        La temporada culmina en la carrera oficial de 5 km. Límite de tiempo: 1 hora. La universidad
        con más hexágonos + mejores tiempos se corona campeona.
      </Text>

      <View style={styles.countdown}>
        <Unit value={days} label="días" color={onPrimary} neon={neon} />
        <Colon color={onPrimary} />
        <Unit value={hours} label="horas" color={onPrimary} neon={neon} />
        <Colon color={onPrimary} />
        <Unit value={minutes} label="min" color={onPrimary} neon={neon} />
        <Colon color={onPrimary} />
        <Unit value={seconds} label="seg" color={onPrimary} neon={neon} />
      </View>

      <View style={styles.footerRow}>
        <Ionicons name="location" size={14} color={onPrimary} />
        <Text style={[styles.footerText, { color: onPrimary }]}>Salida: Arc de Triomf</Text>
        <View style={styles.dot} />
        <Ionicons name="timer" size={14} color={onPrimary} />
        <Text style={[styles.footerText, { color: onPrimary }]}>5 km · cut-off 60:00</Text>
      </View>
    </View>
  );
}

function Unit({ value, label, color, neon }: { value: number; label: string; color: string; neon: string }) {
  return (
    <View style={styles.unit}>
      <View style={[styles.unitBox, { backgroundColor: withAlpha('#000000', 0.22), borderColor: withAlpha(neon, 0.8) }]}>
        <Text style={[styles.unitValue, { color }]}>{String(value).padStart(2, '0')}</Text>
      </View>
      <Text style={[styles.unitLabel, { color: withAlpha(color, 0.8) }]}>{label}</Text>
    </View>
  );
}

function Colon({ color }: { color: string }) {
  return <Text style={[styles.colon, { color }]}>:</Text>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  glow: { position: 'absolute', width: 260, height: 260, borderRadius: 130, right: -90, top: -120 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  tagText: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  date: { fontSize: 12, fontWeight: '700' },
  title: { marginTop: 12, fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { marginTop: 6, fontSize: 13, lineHeight: 19 },
  countdown: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginTop: 18, gap: 4 },
  unit: { alignItems: 'center', gap: 4 },
  unitBox: { minWidth: 58, paddingVertical: 8, borderRadius: 12, alignItems: 'center', borderWidth: 1.5 },
  unitValue: { fontSize: 26, fontWeight: '900', fontVariant: ['tabular-nums'] },
  unitLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  colon: { fontSize: 26, fontWeight: '900', marginTop: 6 },
  footerRow: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 12, fontWeight: '700' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: withAlpha('#FFFFFF', 0.6), marginHorizontal: 4 },
});
