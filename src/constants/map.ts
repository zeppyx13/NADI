import type { MapStyleElement } from 'react-native-maps';

import type {
  MapLatLng,
  MapLayerGroup,
  MapLayerVisibility,
  MapRegion,
} from '@/types/map';

/**
 * Google Places keys are read from the Expo public environment. They are never
 * hardcoded and never logged. The map itself receives its key through the
 * native Google Maps SDK configuration in `app.config.ts`.
 */
const configuredPlacesKey =
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY?.trim() || null;

export const baliMapCenter: MapLatLng = {
  latitude: -8.4095,
  longitude: 115.1889,
};

/** Whole-island overview used on first render and on reset. */
export const baliRegion: MapRegion = {
  ...baliMapCenter,
  latitudeDelta: 1.55,
  longitudeDelta: 1.55,
};

/** Fallback origin used while a real device location is unavailable. */
export const simulatedStartCoordinate: MapLatLng = {
  latitude: -8.6705,
  longitude: 115.2126,
};

/** Bali bounding box used to bias Google Places results. */
export const baliSearchBounds = {
  low: { latitude: -8.95, longitude: 114.4 },
  high: { latitude: -8.02, longitude: 115.75 },
} as const;

export const mapRegionDeltas = {
  place: 0.045,
  destination: 0.06,
  neighborhood: 0.02,
} as const;

/**
 * Below this longitude delta the map is considered close enough to draw every
 * destination individually instead of grouped markers.
 */
export const clusterDisableLongitudeDelta = 0.12;

export const mapClusterGridSize = 4;

export const googlePlacesConfig = {
  apiKey: configuredPlacesKey,
  isEnabled: Boolean(configuredPlacesKey),
  searchUrl: 'https://places.googleapis.com/v1/places:searchText',
  fieldMask:
    'places.id,places.displayName,places.formattedAddress,places.location',
  maxResults: 6,
} as const;

/**
 * Keeps the Google basemap readable underneath NADI markers by muting
 * commercial points of interest and transit clutter.
 */
export const cleanMapStyle: readonly MapStyleElement[] = [
  {
    featureType: 'poi.business',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
];

export const initialLayerVisibility: MapLayerVisibility = {
  routes: true,
  itineraryStops: true,
  traffic: false,
  incidents: true,
  cctvAtcs: false,
  destinations: true,
  crowd: false,
  parking: false,
  safety: false,
  userLocation: true,
};

/**
 * Layers that only exist as visibility state in this phase. They are shown in
 * the filter sheet as unavailable so the grouping stays stable for later work.
 */
export const pendingMapLayers = ['traffic', 'cctvAtcs', 'parking'] as const;

export const mapLayerGroups: readonly MapLayerGroup[] = [
  { id: 'journey', layers: ['routes', 'itineraryStops'] },
  { id: 'mobility', layers: ['traffic', 'incidents', 'cctvAtcs'] },
  { id: 'tourism', layers: ['destinations', 'crowd', 'parking'] },
  { id: 'safety', layers: ['safety'] },
];
