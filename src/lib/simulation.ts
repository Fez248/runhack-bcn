import type { LatLng } from 'react-native-maps';

import { haversineMeters } from './hexGrid';

/** Plaça Catalunya → Passeig de Gràcia → Diagonal → Francesc Macià. */
export const DEMO_WAYPOINTS: LatLng[] = [
  { latitude: 41.387, longitude: 2.17 },
  { latitude: 41.3887, longitude: 2.1683 },
  { latitude: 41.3917, longitude: 2.165 },
  { latitude: 41.3938, longitude: 2.1628 },
  { latitude: 41.3956, longitude: 2.1609 },
  { latitude: 41.3962, longitude: 2.1548 },
  { latitude: 41.395, longitude: 2.1495 },
  { latitude: 41.3925, longitude: 2.144 },
];

export const BARCELONA_CENTER: LatLng = { latitude: 41.3915, longitude: 2.163 };

/** Interpolate the waypoints so the runner moves `stepMeters` per tick. */
export function buildDemoRoute(stepMeters = 18): LatLng[] {
  const route: LatLng[] = [];
  for (let i = 0; i < DEMO_WAYPOINTS.length - 1; i++) {
    const from = DEMO_WAYPOINTS[i];
    const to = DEMO_WAYPOINTS[i + 1];
    const steps = Math.max(1, Math.round(haversineMeters(from, to) / stepMeters));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      route.push({
        latitude: from.latitude + (to.latitude - from.latitude) * t,
        longitude: from.longitude + (to.longitude - from.longitude) * t,
      });
    }
  }
  route.push(DEMO_WAYPOINTS[DEMO_WAYPOINTS.length - 1]);
  return route;
}

/** Milliseconds between simulated GPS fixes (≈ 4 min/km pace, sped up). */
export const DEMO_TICK_MS = 350;
