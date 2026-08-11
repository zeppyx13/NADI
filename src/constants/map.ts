import type { MapStyleElement } from 'react-native-maps';

import type {
  MapLatLng,
  MapLayerGroup,
  MapLayerId,
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

/**
 * Routes uses its own key and never borrows the Places key. Sharing them hid a
 * real failure: a key restricted to the Places API answers Routes requests with
 * HTTP 403, which used to look like a generic error and fell straight through
 * to the local fallback geometry.
 *
 * One key may still serve both APIs — set the same value in both variables.
 */
const configuredRoutesKey =
  process.env.EXPO_PUBLIC_GOOGLE_ROUTES_API_KEY?.trim() || null;

export const googlePlacesConfig = {
  apiKey: configuredPlacesKey,
  isEnabled: Boolean(configuredPlacesKey),
  searchUrl: 'https://places.googleapis.com/v1/places:searchText',
  fieldMask:
    'places.id,places.displayName,places.formattedAddress,places.location',
  maxResults: 6,
} as const;

export const googleRoutesConfig = {
  apiKey: configuredRoutesKey,
  isEnabled: Boolean(configuredRoutesKey),
  computeUrl: 'https://routes.googleapis.com/directions/v2:computeRoutes',
  fieldMask: [
    'routes.duration',
    'routes.staticDuration',
    'routes.distanceMeters',
    'routes.polyline.encodedPolyline',
    'routes.routeLabels',
  ].join(','),
  /** HIGH_QUALITY keeps every bend of the road in the encoded polyline. */
  polylineQuality: 'HIGH_QUALITY',
  maxAlternatives: 3,
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

/**
 * Default view: destinations, road traffic and incidents on; the denser layers
 * start off so the map stays readable until the user asks for them.
 */
export const initialLayerVisibility: MapLayerVisibility = {
  routes: true,
  itineraryStops: true,
  traffic: true,
  incidents: true,
  cctvAtcs: false,
  destinations: true,
  crowd: false,
  parking: false,
  safety: false,
  userLocation: true,
};

/**
 * Layers that exist as visibility state but have no data yet. They render in
 * the filter sheet as unavailable. Every layer carries data from Phase 2 on,
 * so the list is empty until a future layer is introduced ahead of its dataset.
 */
export const pendingMapLayers: readonly MapLayerId[] = [];

export const mapLayerGroups: readonly MapLayerGroup[] = [
  { id: 'journey', layers: ['routes', 'itineraryStops'] },
  { id: 'mobility', layers: ['traffic', 'incidents', 'cctvAtcs'] },
  { id: 'tourism', layers: ['destinations', 'crowd', 'parking'] },
  { id: 'safety', layers: ['safety'] },
];
