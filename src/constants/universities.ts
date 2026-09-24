export type UniversityId = 'UB' | 'UPC' | 'UPF' | 'UAB';

export type University = {
  id: UniversityId;
  name: string;
  shortName: string;
  motto: string;
  /** Solid brand color used for buttons, tab bar and accents. */
  primary: string;
  /** Neon variant used to paint conquered hexagons. */
  neon: string;
  /** Text color that reads well on top of `primary`. */
  onPrimary: string;
};

export const UNIVERSITIES: Record<UniversityId, University> = {
  UB: {
    id: 'UB',
    name: 'Universitat de Barcelona',
    shortName: 'UB',
    motto: 'Libertas perfundet omnia luce',
    primary: '#0B2A6B',
    neon: '#2F6BFF',
    onPrimary: '#FFFFFF',
  },
  UPC: {
    id: 'UPC',
    name: 'Universitat Politècnica de Catalunya',
    shortName: 'UPC',
    motto: 'BarcelonaTech',
    primary: '#00A9E0',
    neon: '#00E5FF',
    onPrimary: '#FFFFFF',
  },
  UPF: {
    id: 'UPF',
    name: 'Universitat Pompeu Fabra',
    shortName: 'UPF',
    motto: 'Wellbeing Planet',
    primary: '#E2001A',
    neon: '#FF2D55',
    onPrimary: '#FFFFFF',
  },
  UAB: {
    id: 'UAB',
    name: 'Universitat Autònoma de Barcelona',
    shortName: 'UAB',
    motto: 'Campus d\u2019Excel·lència',
    primary: '#6DB33F',
    neon: '#B4FF39',
    onPrimary: '#FFFFFF',
  },
};

export const UNIVERSITY_LIST: University[] = [
  UNIVERSITIES.UB,
  UNIVERSITIES.UPC,
  UNIVERSITIES.UPF,
  UNIVERSITIES.UAB,
];

/** Neutral light-mode palette shared by every faction. */
export const BASE = {
  background: '#F7F8FA',
  surface: '#FFFFFF',
  text: '#111827',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  fog: 'rgba(255,255,255,0.55)',
  fogStroke: 'rgba(255,255,255,0.9)',
};

export function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
