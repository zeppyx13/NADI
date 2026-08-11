import type { RouteRisk } from '@/types/itinerary';

export type MapCoordinate = [longitude: number, latitude: number];

export type MapLatLng = {
  latitude: number;
  longitude: number;
};

export type MapRegion = MapLatLng & {
  latitudeDelta: number;
  longitudeDelta: number;
};

export type MapViewportPadding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

/**
 * NADI never treats every map point as an internal destination.
 * The source keeps Google results, NADI catalog entries, and manual points apart.
 */
export type MapPlaceSource =
  | 'nadi-destination'
  | 'google-place'
  | 'custom-map-point';

export type MapInteractionMode =
  | 'explore'
  | 'place-selected'
  | 'destination-selected'
  | 'incident-selected'
  | 'monitoring-selected'
  | 'route-preview'
  | 'active-journey'
  | 'reoptimization-pending'
  | 'pick-location';

export type MapRouteVisualState =
  | 'fastest'
  | 'safest'
  | 'balanced'
  | 'active'
  | 'alternative'
  | 'affected';

/**
 * Visibility only. Hiding a layer never removes the data from NADI reasoning.
 */
export type MapLayerVisibility = {
  routes: boolean;
  itineraryStops: boolean;
  traffic: boolean;
  incidents: boolean;
  cctvAtcs: boolean;
  destinations: boolean;
  crowd: boolean;
  parking: boolean;
  safety: boolean;
  userLocation: boolean;
};

export type MapLayerId = keyof MapLayerVisibility;

export type MapLayerGroupId =
  | 'journey'
  | 'mobility'
  | 'tourism'
  | 'safety';

export type MapLayerGroup = {
  id: MapLayerGroupId;
  layers: readonly MapLayerId[];
};

export type MapSafetyCondition = {
  routeRisk: RouteRisk;
};

export type MapRouteLine = {
  id: string;
  coordinates: readonly MapLatLng[];
  visualState: MapRouteVisualState;
};

/**
 * A place the user can pick from search. Google suggestions already carry
 * coordinates, so no second lookup is needed before moving the camera.
 */
export type MapPlaceResult = {
  id: string;
  source: MapPlaceSource;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  /** Present when the result comes from the NADI catalog. */
  destinationId?: string;
  /** Present when the result comes from Google Places. */
  placeId?: string;
};

export type MapPlaceSearchStatus =
  | 'idle'
  | 'searching'
  | 'ready'
  | 'unavailable'
  | 'error';

export type MapDestinationPressResult =
  | {
      type: 'destination';
      destinationId: string;
    }
  | {
      type: 'cluster';
      coordinate: MapLatLng;
      region: MapRegion;
    };
