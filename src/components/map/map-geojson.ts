import type {
  Feature,
  FeatureCollection,
  Geometry,
  LineString,
  Point,
} from 'geojson';

import type { OccupancyLevel } from '@/constants/theme';
import type { Destination, IntelligenceCoverage } from '@/types/destination';
import type { ItineraryPlace, RouteRisk } from '@/types/itinerary';
import type {
  MapCoordinate,
  MapRouteLine,
  MapRouteVisualState,
  MapSafetyCondition,
} from '@/types/map';
import type {
  AlertSeverity,
  TravelAlert,
  TravelAlertScope,
  TravelAlertType,
} from '@/types/travel-alert';

export type DestinationFeatureProperties = {
  destinationId: string;
  intelligenceCoverage: IntelligenceCoverage;
  occupancyLevel: OccupancyLevel | 'unknown';
  priority: boolean;
  selected: boolean;
};

export type IncidentFeatureProperties = {
  alertId: string;
  alertType: TravelAlertType;
  scope: TravelAlertScope;
  severity: AlertSeverity;
  routeRelevant: boolean;
  selected: boolean;
};

export type CrowdFeatureProperties = {
  destinationId: string;
  occupancyLevel: OccupancyLevel;
};

export type SafetyFeatureProperties = {
  destinationId: string;
  routeRisk: RouteRisk;
};

export type RouteFeatureProperties = {
  routeId: string;
  visualState: MapRouteVisualState;
};

export type UserLocationFeatureProperties = {
  kind: 'user-location';
};

export type CustomPlaceFeatureProperties = {
  placeId: string;
  selected: boolean;
};

export type DestinationFeatureCollections = {
  catalog: FeatureCollection<Point, DestinationFeatureProperties>;
  featured: FeatureCollection<Point, DestinationFeatureProperties>;
};

export function readFeatureString(
  feature: Feature,
  propertyName: string,
): string | undefined {
  const properties = feature.properties as Record<string, unknown> | null;
  const value = properties?.[propertyName];
  return typeof value === 'string' ? value : undefined;
}

export function readFeatureNumber(
  feature: Feature,
  propertyName: string,
): number | undefined {
  const properties = feature.properties as Record<string, unknown> | null;
  const value = properties?.[propertyName];
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

export function readPointCoordinate(
  feature: Feature,
): MapCoordinate | undefined {
  if (feature.geometry?.type !== 'Point') return undefined;
  const [longitude, latitude] = feature.geometry.coordinates;
  if (
    typeof longitude !== 'number' ||
    !Number.isFinite(longitude) ||
    typeof latitude !== 'number' ||
    !Number.isFinite(latitude)
  ) {
    return undefined;
  }

  return [longitude, latitude];
}

function createFeatureCollection<G extends Geometry | null, P>(
  features: Feature<G, P>[],
): FeatureCollection<G, P> {
  return {
    type: 'FeatureCollection',
    features,
  };
}

function createPointFeature<P>(
  id: string,
  coordinate: MapCoordinate,
  properties: P,
): Feature<Point, P> {
  return {
    type: 'Feature',
    id,
    geometry: {
      type: 'Point',
      coordinates: [...coordinate],
    },
    properties,
  };
}

function destinationCoordinate(destination: Destination): MapCoordinate {
  return [destination.longitude, destination.latitude];
}

function destinationFeature(
  destination: Destination,
  priority: boolean,
  selected: boolean,
): Feature<Point, DestinationFeatureProperties> {
  return createPointFeature(destination.id, destinationCoordinate(destination), {
    destinationId: destination.id,
    intelligenceCoverage: destination.intelligenceCoverage,
    occupancyLevel: destination.occupancyLevel ?? 'unknown',
    priority,
    selected,
  });
}

export function destinationsToGeoJSON(
  destinations: readonly Destination[],
  selectedDestinationId?: string,
  priorityDestinationIds: readonly string[] = [],
): DestinationFeatureCollections {
  const priorityIds = new Set(priorityDestinationIds);
  const catalog: Feature<Point, DestinationFeatureProperties>[] = [];
  const featured: Feature<Point, DestinationFeatureProperties>[] = [];

  destinations.forEach((destination) => {
    const selected = destination.id === selectedDestinationId;
    const priority = priorityIds.has(destination.id);
    const feature = destinationFeature(destination, priority, selected);

    if (
      destination.intelligenceCoverage === 'pilot' ||
      priority ||
      selected
    ) {
      featured.push(feature);
      return;
    }

    catalog.push(feature);
  });

  return {
    catalog: createFeatureCollection(catalog),
    featured: createFeatureCollection(featured),
  };
}

export function alertsToGeoJSON(
  alerts: readonly TravelAlert[],
  selectedAlertId?: string,
  routeRelevantAlertIds: readonly string[] = [],
): FeatureCollection<Point, IncidentFeatureProperties> {
  const routeRelevantIds = new Set(routeRelevantAlertIds);
  return createFeatureCollection(
    alerts.map((alert) =>
      createPointFeature(
        alert.id,
        [alert.longitude, alert.latitude],
        {
          alertId: alert.id,
          alertType: alert.type,
          scope: alert.scope,
          severity: alert.severity,
          routeRelevant: routeRelevantIds.has(alert.id),
          selected: alert.id === selectedAlertId,
        },
      ),
    ),
  );
}

export function pilotCrowdToGeoJSON(
  destinations: readonly Destination[],
): FeatureCollection<Point, CrowdFeatureProperties> {
  return createFeatureCollection(
    destinations.flatMap((destination) => {
      if (
        destination.intelligenceCoverage !== 'pilot' ||
        !destination.occupancyLevel
      ) {
        return [];
      }

      return [
        createPointFeature(destination.id, destinationCoordinate(destination), {
          destinationId: destination.id,
          occupancyLevel: destination.occupancyLevel,
        }),
      ];
    }),
  );
}

export function pilotSafetyToGeoJSON(
  destinations: readonly Destination[],
  conditionsByDestinationId: Readonly<
    Record<string, MapSafetyCondition | undefined>
  >,
): FeatureCollection<Point, SafetyFeatureProperties> {
  return createFeatureCollection(
    destinations.flatMap((destination) => {
      const condition = conditionsByDestinationId[destination.id];
      if (destination.intelligenceCoverage !== 'pilot' || !condition) {
        return [];
      }

      return [
        createPointFeature(destination.id, destinationCoordinate(destination), {
          destinationId: destination.id,
          routeRisk: condition.routeRisk,
        }),
      ];
    }),
  );
}

export function routesToGeoJSON(
  routes: readonly MapRouteLine[],
): FeatureCollection<LineString, RouteFeatureProperties> {
  const features = routes.flatMap((route) => {
    if (route.coordinates.length < 2) return [];

    const feature: Feature<LineString, RouteFeatureProperties> = {
      type: 'Feature',
      id: route.id,
      geometry: {
        type: 'LineString',
        coordinates: route.coordinates.map((coordinate) => [...coordinate]),
      },
      properties: {
        routeId: route.id,
        visualState: route.visualState,
      },
    };

    return [feature];
  });

  return createFeatureCollection(features);
}

export function userLocationToGeoJSON(
  coordinate?: MapCoordinate,
): FeatureCollection<Point, UserLocationFeatureProperties> {
  return createFeatureCollection(
    coordinate
      ? [
          createPointFeature('user-location', coordinate, {
            kind: 'user-location',
          }),
        ]
      : [],
  );
}

export function customPlacesToGeoJSON(
  places: readonly ItineraryPlace[],
  selectedPlaceId?: string,
): FeatureCollection<Point, CustomPlaceFeatureProperties> {
  return createFeatureCollection(
    places.flatMap((place) => {
      if (place.source !== 'custom-map-point') return [];

      return [
        createPointFeature(place.id, [place.longitude, place.latitude], {
          placeId: place.id,
          selected: place.id === selectedPlaceId,
        }),
      ];
    }),
  );
}
