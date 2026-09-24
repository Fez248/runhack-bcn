import * as Location from 'expo-location';
import { gridDisk, latLngToCell } from 'h3-js';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { LatLng } from 'react-native-maps';

import { UNIVERSITIES, UNIVERSITY_LIST, type University, type UniversityId } from '@/constants/universities';
import { cellsAlong, HEX_RESOLUTION } from '@/lib/hexGrid';
import { buildDemoRoute, DEMO_TICK_MS } from '@/lib/simulation';

export const SWARM_DURATION_MS = 45_000;
export const SWARM_MULTIPLIER = 3;

type Territory = Record<string, UniversityId>;
type Scores = Record<UniversityId, number>;
type TrackingMode = 'idle' | 'gps' | 'simulation';

type GameState = {
  university: University | null;
  selectUniversity: (id: UniversityId) => void;
  resetFaction: () => void;

  territory: Territory;
  hexCount: Scores;
  points: Scores;

  position: LatLng | null;
  track: LatLng[];
  mode: TrackingMode;
  locationError: string | null;
  distanceMeters: number;

  swarmUntil: number | null;
  swarmActive: boolean;
  swarmSecondsLeft: number;
  multiplier: number;
  triggerSwarm: () => void;

  startSimulation: () => void;
  stopSimulation: () => void;
};

const GameContext = createContext<GameState | null>(null);

const ZERO_SCORES: Scores = { UB: 0, UPC: 0, UPF: 0, UAB: 0 };

/** Rival outposts placed along the demo route so overwriting is visible. */
const RIVAL_OUTPOSTS: { center: LatLng; rings: number }[] = [
  { center: { latitude: 41.3917, longitude: 2.165 }, rings: 2 }, // Casa Batlló
  { center: { latitude: 41.3956, longitude: 2.1609 }, rings: 2 }, // Pg. de Gràcia / Diagonal
  { center: { latitude: 41.395, longitude: 2.1495 }, rings: 1 }, // Diagonal
  { center: { latitude: 41.3868, longitude: 2.1755 }, rings: 2 }, // Urquinaona
  { center: { latitude: 41.3825, longitude: 2.1769 }, rings: 1 }, // Via Laietana
  { center: { latitude: 41.4036, longitude: 2.1744 }, rings: 2 }, // Sagrada Família
];

function seedRivalTerritory(player: UniversityId): Territory {
  const rivals = UNIVERSITY_LIST.filter((u) => u.id !== player);
  const territory: Territory = {};
  RIVAL_OUTPOSTS.forEach((outpost, i) => {
    const owner = rivals[i % rivals.length].id;
    const origin = latLngToCell(outpost.center.latitude, outpost.center.longitude, HEX_RESOLUTION);
    for (const cell of gridDisk(origin, outpost.rings)) territory[cell] = owner;
  });
  return territory;
}

function countHexes(territory: Territory): Scores {
  const counts: Scores = { ...ZERO_SCORES };
  for (const owner of Object.values(territory)) counts[owner] += 1;
  return counts;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [universityId, setUniversityId] = useState<UniversityId | null>(null);
  const [territory, setTerritory] = useState<Territory>({});
  const [points, setPoints] = useState<Scores>(ZERO_SCORES);
  const [position, setPosition] = useState<LatLng | null>(null);
  const [track, setTrack] = useState<LatLng[]>([]);
  const [mode, setMode] = useState<TrackingMode>('idle');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [swarmUntil, setSwarmUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const territoryRef = useRef<Territory>({});
  const lastPositionRef = useRef<LatLng | null>(null);
  const swarmUntilRef = useRef<number | null>(null);
  const universityRef = useRef<UniversityId | null>(null);
  const simulationTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const gpsRequestId = useRef(0);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const commitTerritory = useCallback((next: Territory) => {
    territoryRef.current = next;
    setTerritory(next);
  }, []);

  const swarmActive = swarmUntil !== null && swarmUntil > now;
  const multiplier = swarmActive ? SWARM_MULTIPLIER : 1;
  const swarmSecondsLeft = swarmActive && swarmUntil ? Math.ceil((swarmUntil - now) / 1000) : 0;

  useEffect(() => {
    if (!swarmActive) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [swarmActive]);

  /** Register a new GPS fix (real or simulated) and conquer every hex crossed. */
  const ingestFix = useCallback((fix: LatLng) => {
    const owner = universityRef.current;
    if (!owner) return;
    const previous = lastPositionRef.current ?? fix;
    lastPositionRef.current = fix;

    const crossed = cellsAlong(previous, fix);
    const activeMultiplier =
      swarmUntilRef.current && swarmUntilRef.current > Date.now() ? SWARM_MULTIPLIER : 1;

    const current = territoryRef.current;
    const conquered = crossed.filter((cell) => current[cell] !== owner);
    if (conquered.length > 0) {
      const next = { ...current };
      for (const cell of conquered) next[cell] = owner;
      commitTerritory(next);
      const gained = conquered.length * 10 * activeMultiplier;
      setPoints((p) => ({ ...p, [owner]: p[owner] + gained }));
    }

    setPosition(fix);
    setTrack((t) => (t.length > 600 ? [...t.slice(-500), fix] : [...t, fix]));
    setDistanceMeters((d) => {
      if (previous === fix) return d;
      const dLat = (fix.latitude - previous.latitude) * 111_320;
      const dLng =
        (fix.longitude - previous.longitude) * 111_320 * Math.cos((fix.latitude * Math.PI) / 180);
      return d + Math.hypot(dLat, dLng);
    });
  }, [commitTerritory]);

  const stopGps = useCallback(() => {
    gpsRequestId.current += 1;
    locationSubscription.current?.remove();
    locationSubscription.current = null;
  }, []);

  const startGps = useCallback(async () => {
    stopGps();
    setLocationError(null);
    const requestId = ++gpsRequestId.current;
    const stale = () => requestId !== gpsRequestId.current;
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationError('Permiso de ubicación denegado. Usa el modo simulación.');
      return;
    }
    try {
      const initial = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (stale()) return;
      const fix = { latitude: initial.coords.latitude, longitude: initial.coords.longitude };
      lastPositionRef.current = fix;
      setPosition(fix);
    } catch {
      // A first fix can time out indoors; the watcher below will keep trying.
    }
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 5,
        timeInterval: 1000,
      },
      (update) =>
        ingestFix({ latitude: update.coords.latitude, longitude: update.coords.longitude }),
    );
    if (stale()) {
      subscription.remove();
      return;
    }
    locationSubscription.current = subscription;
    setMode('gps');
  }, [ingestFix, stopGps]);

  const stopSimulation = useCallback(() => {
    if (simulationTimer.current) clearInterval(simulationTimer.current);
    simulationTimer.current = null;
    lastPositionRef.current = null;
    if (universityRef.current) void startGps();
    else setMode('idle');
  }, [startGps]);

  const startSimulation = useCallback(() => {
    stopGps();
    if (simulationTimer.current) clearInterval(simulationTimer.current);
    const route = buildDemoRoute();
    let index = 0;
    lastPositionRef.current = null;
    setTrack([]);
    setMode('simulation');
    ingestFix(route[0]);
    simulationTimer.current = setInterval(() => {
      index += 1;
      if (index >= route.length) {
        if (simulationTimer.current) clearInterval(simulationTimer.current);
        simulationTimer.current = null;
        return;
      }
      ingestFix(route[index]);
    }, DEMO_TICK_MS);
  }, [ingestFix, stopGps]);

  const selectUniversity = useCallback(
    (id: UniversityId) => {
      universityRef.current = id;
      setUniversityId(id);
      commitTerritory(seedRivalTerritory(id));
      setPoints(ZERO_SCORES);
      setTrack([]);
      setDistanceMeters(0);
      swarmUntilRef.current = null;
      setSwarmUntil(null);
      void startGps();
    },
    [commitTerritory, startGps],
  );

  const resetFaction = useCallback(() => {
    stopGps();
    if (simulationTimer.current) clearInterval(simulationTimer.current);
    simulationTimer.current = null;
    universityRef.current = null;
    lastPositionRef.current = null;
    setUniversityId(null);
    commitTerritory({});
    setPoints(ZERO_SCORES);
    setTrack([]);
    setPosition(null);
    setMode('idle');
    setDistanceMeters(0);
    swarmUntilRef.current = null;
    setSwarmUntil(null);
  }, [commitTerritory, stopGps]);

  const triggerSwarm = useCallback(() => {
    const until = Date.now() + SWARM_DURATION_MS;
    swarmUntilRef.current = until;
    setSwarmUntil(until);
    setNow(Date.now());
  }, []);

  useEffect(
    () => () => {
      stopGps();
      if (simulationTimer.current) clearInterval(simulationTimer.current);
    },
    [stopGps],
  );

  const hexCount = useMemo(() => countHexes(territory), [territory]);

  const value = useMemo<GameState>(
    () => ({
      university: universityId ? UNIVERSITIES[universityId] : null,
      selectUniversity,
      resetFaction,
      territory,
      hexCount,
      points,
      position,
      track,
      mode,
      locationError,
      distanceMeters,
      swarmUntil,
      swarmActive,
      swarmSecondsLeft,
      multiplier,
      triggerSwarm,
      startSimulation,
      stopSimulation,
    }),
    [
      universityId,
      selectUniversity,
      resetFaction,
      territory,
      hexCount,
      points,
      position,
      track,
      mode,
      locationError,
      distanceMeters,
      swarmUntil,
      swarmActive,
      swarmSecondsLeft,
      multiplier,
      triggerSwarm,
      startSimulation,
      stopSimulation,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameState {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
}

/** Faction-aware theme: falls back to a neutral slate before a team is chosen. */
export function useTheme() {
  const { university } = useGame();
  return {
    primary: university?.primary ?? '#334155',
    neon: university?.neon ?? '#94A3B8',
    onPrimary: university?.onPrimary ?? '#FFFFFF',
  };
}
