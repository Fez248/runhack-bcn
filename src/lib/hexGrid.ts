import { cellToBoundary, gridDisk, latLngToCell } from 'h3-js';
import type { LatLng } from 'react-native-maps';

/**
 * H3 resolution 10 → hexagons with ~66 m edges (~15 000 m²), a good size for
 * a runner to capture one every few seconds.
 */
export const HEX_RESOLUTION = 10;

/** Number of hexagon rings of "fog" rendered around the runner. */
export const FOG_RINGS = 7;

export function cellFor(point: LatLng): string {
  return latLngToCell(point.latitude, point.longitude, HEX_RESOLUTION);
}

export function boundaryFor(cell: string): LatLng[] {
  return cellToBoundary(cell).map(([latitude, longitude]) => ({ latitude, longitude }));
}

export function fogAroundCell(cell: string, rings = FOG_RINGS): string[] {
  return gridDisk(cell, rings);
}

/** Every cell touched by walking the segment between two points. */
export function cellsAlong(from: LatLng, to: LatLng, stepMeters = 20): string[] {
  const distance = haversineMeters(from, to);
  const steps = Math.max(1, Math.ceil(distance / stepMeters));
  const cells = new Set<string>();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    cells.add(
      cellFor({
        latitude: from.latitude + (to.latitude - from.latitude) * t,
        longitude: from.longitude + (to.longitude - from.longitude) * t,
      }),
    );
  }
  return [...cells];
}

export function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
