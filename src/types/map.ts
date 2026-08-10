import type { RouteRisk } from '@/types/itinerary';

export type MapCoordinate = [longitude: number, latitude: number];

export type MapViewportPadding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type MapInteractionMode =
  | 'explore'
  | 'destination-selected'
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

export type MapLayerVisibility = {
  destinations: boolean;
  incidents: boolean;
  crowd: boolean;
  safety: boolean;
  routes: boolean;
  userLocation: boolean;
  customPlaces: boolean;
};

export type MapSafetyCondition = {
  routeRisk: RouteRisk;
};

export type MapRouteLine = {
  id: string;
  coordinates: readonly MapCoordinate[];
  visualState: MapRouteVisualState;
};

export type MapDestinationPressResult =
  | {
      type: 'destination';
      destinationId: string;
    }
  | {
      type: 'cluster';
      coordinate: MapCoordinate;
      zoom: number;
    };
