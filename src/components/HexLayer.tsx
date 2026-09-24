import React, { memo, useMemo } from 'react';
import { Polygon, type LatLng } from 'react-native-maps';

import { BASE, UNIVERSITIES, withAlpha, type UniversityId } from '@/constants/universities';
import { boundaryFor, cellFor, fogAroundCell } from '@/lib/hexGrid';

type Props = {
  territory: Record<string, UniversityId>;
  position: LatLng | null;
};

const FogHex = memo(function FogHex({ cell }: { cell: string }) {
  const coordinates = useMemo(() => boundaryFor(cell), [cell]);
  return (
    <Polygon
      coordinates={coordinates}
      fillColor={BASE.fog}
      strokeColor={BASE.fogStroke}
      strokeWidth={1}
      tappable={false}
    />
  );
});

const TerritoryHex = memo(function TerritoryHex({
  cell,
  owner,
}: {
  cell: string;
  owner: UniversityId;
}) {
  const coordinates = useMemo(() => boundaryFor(cell), [cell]);
  const neon = UNIVERSITIES[owner].neon;
  return (
    <Polygon
      coordinates={coordinates}
      fillColor={withAlpha(neon, 0.42)}
      strokeColor={withAlpha(neon, 0.95)}
      strokeWidth={2}
      tappable={false}
    />
  );
});

/**
 * Frosted-glass "fog of war" around the runner plus every conquered hexagon,
 * painted in the neon color of the university that owns it.
 */
function HexLayerComponent({ territory, position }: Props) {
  const originCell = position ? cellFor(position) : null;

  const fogCells = useMemo(() => (originCell ? fogAroundCell(originCell) : []), [originCell]);

  const visibleFog = useMemo(
    () => fogCells.filter((cell) => !territory[cell]),
    [fogCells, territory],
  );

  return (
    <>
      {visibleFog.map((cell) => (
        <FogHex key={`fog-${cell}`} cell={cell} />
      ))}
      {Object.entries(territory).map(([cell, owner]) => (
        <TerritoryHex key={cell} cell={cell} owner={owner} />
      ))}
    </>
  );
}

export const HexLayer = memo(HexLayerComponent);
