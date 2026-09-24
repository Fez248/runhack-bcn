import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UniRunBanner } from '@/components/UniRunBanner';
import { BASE, UNIVERSITY_LIST, withAlpha } from '@/constants/universities';
import { useGame, useTheme } from '@/context/GameContext';

const MEDALS = ['🥇', '🥈', '🥉', '4º'];

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { university, hexCount, points, resetFaction } = useGame();

  const ranking = useMemo(
    () =>
      [...UNIVERSITY_LIST]
        .map((u) => ({ ...u, hexes: hexCount[u.id], points: points[u.id] }))
        .sort((a, b) => b.hexes - a.hexes || b.points - a.points),
    [hexCount, points],
  );
  const maxHexes = Math.max(1, ...ranking.map((r) => r.hexes));
  const totalHexes = ranking.reduce((sum, r) => sum + r.hexes, 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      <UniRunBanner primary={theme.primary} neon={theme.neon} onPrimary={theme.onPrimary} />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>University ranking</Text>
        <Text style={styles.sectionMeta}>{totalHexes} hexes in play</Text>
      </View>

      <View style={styles.list}>
        {ranking.map((team, index) => {
          const mine = team.id === university?.id;
          const share = totalHexes ? Math.round((team.hexes / totalHexes) * 100) : 0;
          return (
            <View
              key={team.id}
              style={[
                styles.row,
                mine && { borderColor: team.primary, backgroundColor: withAlpha(team.primary, 0.05) },
              ]}
            >
              <Text style={styles.medal}>{MEDALS[index]}</Text>
              <View style={[styles.teamSwatch, { backgroundColor: team.primary }]}>
                <Text style={styles.teamSwatchText}>{team.shortName}</Text>
              </View>
              <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                  <Text style={styles.teamName} numberOfLines={1}>
                    {team.name}
                  </Text>
                  {mine && (
                    <View style={[styles.youTag, { backgroundColor: team.primary }]}>
                      <Text style={styles.youTagText}>YOU</Text>
                    </View>
                  )}
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${(team.hexes / maxHexes) * 100}%`, backgroundColor: team.neon },
                    ]}
                  />
                </View>
                <Text style={styles.rowMeta}>
                  {team.hexes} hex · {share}% of the map · {team.points.toLocaleString('en-US')} pts
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.rules}>
        <Ionicons name="information-circle" size={18} color={BASE.textMuted} />
        <Text style={styles.rulesText}>
          Every H3 hexagon (res. 10, ~66 m sides) counts as 1 territory point. Run with your team in
          Swarm mode to triple conquest points.
        </Text>
      </View>

      <Pressable
        onPress={() => {
          resetFaction();
          router.replace('/');
        }}
        style={({ pressed }) => [styles.switchTeam, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Ionicons name="swap-horizontal" size={16} color={theme.primary} />
        <Text style={[styles.switchTeamText, { color: theme.primary }]}>Switch university</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BASE.background },
  content: { paddingHorizontal: 16, paddingBottom: 32, gap: 16 },
  sectionHeader: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: BASE.text },
  sectionMeta: { fontSize: 12, color: BASE.textMuted, fontWeight: '600' },
  list: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: BASE.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: BASE.border,
  },
  medal: { width: 28, fontSize: 18, textAlign: 'center', fontWeight: '800', color: BASE.textMuted },
  teamSwatch: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  teamSwatchText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  rowBody: { flex: 1, gap: 6 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  teamName: { flex: 1, fontSize: 14, fontWeight: '700', color: BASE.text },
  youTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  youTagText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: BASE.border, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  rowMeta: { fontSize: 11, color: BASE.textMuted, fontWeight: '600' },
  rules: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingHorizontal: 4 },
  rulesText: { flex: 1, fontSize: 12, lineHeight: 17, color: BASE.textMuted },
  switchTeam: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  switchTeamText: { fontWeight: '700', fontSize: 13 },
});
