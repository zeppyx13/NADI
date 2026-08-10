import type { StyleSpecification } from '@maplibre/maplibre-react-native';

import { colors } from '@/constants/theme';

const configuredStyleUrl = process.env.EXPO_PUBLIC_MAP_STYLE_URL?.trim() || null;

export const baliMapCenter = [115.1889, -8.4095] as const;
export const baliMapZoom = 7.35;

export const simulatedStartCoordinate = {
  latitude: -8.6705,
  longitude: 115.2126,
} as const;

export const mapFallbackStyle: StyleSpecification = {
  version: 8,
  name: 'NADI local fallback',
  sources: {},
  layers: [
    {
      id: 'nadi-background',
      type: 'background',
      paint: {
        'background-color': colors.brand[50],
      },
    },
  ],
};

export const mapConfig = {
  styleUrl: configuredStyleUrl,
  developmentStyleUrl: 'https://demotiles.maplibre.org/style.json',
  style:
    configuredStyleUrl ??
    (__DEV__ ? 'https://demotiles.maplibre.org/style.json' : mapFallbackStyle),
  usesDevelopmentFallback: !configuredStyleUrl && __DEV__,
} as const;
