import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import React, { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LeafletMap } from '@/components/LeafletMap';
import { SwarmButton } from '@/components/SwarmButton';
import { BASE, withAlpha } from '@/constants/universities';
import { useGame, useTheme } from '@/context/GameContext';
import { BARCELONA_CENTER } from '@/lib/simulation';

export default function MapScreen() {
  useKeepAwake();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const {
    university,
    territory,
    hexCount,
    points,
    position,
    track,
    mode,
    locationError,
    distanceMeters,
    swarmActive,
    swarmSecondsLeft,
    multiplier,
    triggerSwarm,
    startSimulation,
    stopSimulation,
  } = useGame();

  const [follow, setFollow] = useState(true);
  const onUserPan = useCallback(() => setFollow(false), []);
  const secretTaps = useRef<number[]>([]);
  const [simulatorUnlocked, setSimulatorUnlocked] = useState(false);

  const onSecretTap = () => {
    const now = Date.now();
    secretTaps.current = [...secretTaps.current.filter((t) => now - t < 1500), now];
    if (secretTaps.current.length >= 5) {
      secretTaps.current = [];
      setSimulatorUnlocked(true);
    }
  };

  if (!university) return null;

  const myHexes = hexCount[university.id];
  const myPoints = points[university.id];

  return (
    <View style={styles.container}>
      <LeafletMap
        territory={territory}
        position={position}
        track={track}
        accent={theme.primary}
        follow={follow}
        showRunner={mode !== 'idle'}
        initialCenter={BARCELONA_CENTER}
        onUserPan={onUserPan}
      />

      {/* Header / HUD */}
      <View style={[styles.hud, { top: insets.top + 12 }]}>
        <Pressable onPress={onSecretTap} style={[styles.brand, { backgroundColor: theme.primary }]}>
          <Text style={styles.brandText}>{university.shortName}</Text>
        </Pressable>
        <View style={styles.statsCard}>
          <Stat label="Hexes" value={String(myHexes)} color={theme.primary} />
          <View style={styles.divider} />
          <Stat label="Points" value={myPoints.toLocaleString('en-US')} color={theme.primary} />
          <View style={styles.divider} />
          <Stat label="Distance" value={`${(distanceMeters / 1000).toFixed(2)} km`} color={theme.primary} />
        </View>
      </View>

      {swarmActive && (
        <View style={[styles.swarmBanner, { top: insets.top + 96, backgroundColor: theme.primary }]}>
          <Ionicons name="people" size={16} color={theme.onPrimary} />
          <Text style={[styles.swarmBannerText, { color: theme.onPrimary }]}>
            SWARM ×{multiplier} · {swarmSecondsLeft}s · 4 {university.shortName} runners with you
          </Text>
        </View>
      )}

      {locationError && mode !== 'simulation' && (
        <View style={[styles.notice, { top: insets.top + 96 }]}>
          <Ionicons name="warning" size={16} color="#B45309" />
          <Text style={styles.noticeText}>{locationError}</Text>
        </View>
      )}

      {mode === 'simulation' && (
        <View style={[styles.simPill, { top: insets.top + (swarmActive ? 140 : 96), borderColor: theme.primary }]}>
          <View style={[styles.liveDot, { backgroundColor: theme.primary }]} />
          <Text style={[styles.simPillText, { color: theme.primary }]}>DEMO RUN · Pg. de Gràcia → Diagonal</Text>
          <Pressable onPress={stopSimulation} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={theme.primary} />
          </Pressable>
        </View>
      )}

      {/* Right-hand controls */}
      <View style={[styles.controls, { bottom: 24 + insets.bottom }]}>
        {simulatorUnlocked && (
          <Pressable
            onPress={mode === 'simulation' ? stopSimulation : startSimulation}
            style={({ pressed }) => [
              styles.roundButton,
              styles.simButton,
              { borderColor: theme.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons name={mode === 'simulation' ? 'stop' : 'play'} size={22} color={theme.primary} />
          </Pressable>
        )}
        <Pressable
          onPress={() => setFollow(true)}
          style={({ pressed }) => [styles.roundButton, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Ionicons name="locate" size={22} color={follow ? theme.primary : BASE.textMuted} />
        </Pressable>
        <SwarmButton
          active={swarmActive}
          color={theme.primary}
          glow={withAlpha(theme.neon, 0.45)}
          onPress={triggerSwarm}
        />
      </View>

      {!simulatorUnlocked && (
        <Text style={[styles.hint, { bottom: 12 + insets.bottom }]}>
          Tap the badge 5× for demo mode
        </Text>
      )}
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BASE.background },
  hud: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brand: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  brandText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  statsCard: {
    flex: 1,
    height: 56,
    backgroundColor: BASE.surface,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontWeight: '900', fontSize: 16 },
  statLabel: { fontSize: 10, color: BASE.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  divider: { width: 1, height: 28, backgroundColor: BASE.border },
  swarmBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    elevation: 3,
  },
  swarmBannerText: { fontWeight: '800', fontSize: 12, flex: 1 },
  notice: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
  },
  noticeText: { color: '#92400E', fontWeight: '600', fontSize: 12, flex: 1 },
  simPill: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BASE.surface,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    elevation: 3,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  simPillText: { fontWeight: '800', fontSize: 12 },
  controls: { position: 'absolute', right: 16, alignItems: 'center', gap: 12 },
  roundButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BASE.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  simButton: { borderWidth: 2 },
  hint: {
    position: 'absolute',
    left: 16,
    fontSize: 11,
    color: BASE.textMuted,
    backgroundColor: withAlpha('#FFFFFF', 0.8),
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
