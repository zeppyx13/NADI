import { destinations } from '@/data/destinations';
import type {
  ItineraryLocation,
  ItineraryScenarioId,
  ParkingStatus,
  RouteRisk,
  TrafficLevel,
} from '@/types/itinerary';

export const defaultItineraryStartLocation: ItineraryLocation = {
  id: 'denpasar',
  name: 'Denpasar, Bali',
  latitude: -8.6705,
  longitude: 115.2126,
};

export type DestinationScenarioCondition = {
  currentLoadRatio: number;
  basePredictedLoadRatio: number;
  trafficLevel: TrafficLevel;
  routeRisk: RouteRisk;
  parkingStatus: ParkingStatus;
  roadClosed: boolean;
  activeIncidentIds: string[];
  localEventId?: string;
};

export const destinationScenarioConditions: Record<
  string,
  DestinationScenarioCondition
> = {
  'pantai-kuta': {
    currentLoadRatio: 0.78,
    basePredictedLoadRatio: 0.86,
    trafficLevel: 'heavy',
    routeRisk: 'medium',
    parkingStatus: 'limited',
    roadClosed: false,
    activeIncidentIds: ['traffic-kuta-01'],
  },
  ubud: {
    currentLoadRatio: 0.58,
    basePredictedLoadRatio: 0.66,
    trafficLevel: 'moderate',
    routeRisk: 'low',
    parkingStatus: 'available',
    roadClosed: false,
    activeIncidentIds: [],
    localEventId: 'event-ubud-01',
  },
  'tanah-lot': {
    currentLoadRatio: 0.46,
    basePredictedLoadRatio: 0.7,
    trafficLevel: 'moderate',
    routeRisk: 'medium',
    parkingStatus: 'limited',
    roadClosed: false,
    activeIncidentIds: ['risk-tabanan-01'],
  },
  'pantai-lovina': {
    currentLoadRatio: 0.32,
    basePredictedLoadRatio: 0.42,
    trafficLevel: 'smooth',
    routeRisk: 'low',
    parkingStatus: 'available',
    roadClosed: false,
    activeIncidentIds: [],
  },
  'pura-besakih': {
    currentLoadRatio: 0.38,
    basePredictedLoadRatio: 0.49,
    trafficLevel: 'smooth',
    routeRisk: 'low',
    parkingStatus: 'available',
    roadClosed: false,
    activeIncidentIds: [],
  },
};

export const itineraryScenarioDescriptions: Record<ItineraryScenarioId, string> = {
  normal: 'Normal deterministic conditions',
  'destination-crowded': 'Arrival-time crowding at Kuta or Tanah Lot',
  'route-congested': 'Heavy traffic on one remaining route segment',
  'route-incident': 'A route incident affecting the next remaining stop',
};

const pairKey = (fromId: string, toId: string) => [fromId, toId].sort().join(':');

const travelMinutesByPair: Record<string, number> = {
  [pairKey('denpasar', 'pantai-kuta')]: 28,
  [pairKey('denpasar', 'ubud')]: 44,
  [pairKey('denpasar', 'tanah-lot')]: 51,
  [pairKey('denpasar', 'pantai-lovina')]: 132,
  [pairKey('denpasar', 'pura-besakih')]: 87,
  [pairKey('pantai-kuta', 'ubud')]: 62,
  [pairKey('pantai-kuta', 'tanah-lot')]: 48,
  [pairKey('pantai-kuta', 'pantai-lovina')]: 155,
  [pairKey('pantai-kuta', 'pura-besakih')]: 116,
  [pairKey('ubud', 'tanah-lot')]: 74,
  [pairKey('ubud', 'pantai-lovina')]: 118,
  [pairKey('ubud', 'pura-besakih')]: 72,
  [pairKey('tanah-lot', 'pantai-lovina')]: 121,
  [pairKey('tanah-lot', 'pura-besakih')]: 132,
  [pairKey('pantai-lovina', 'pura-besakih')]: 154,
};

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

function getDistanceKilometers(
  first: { latitude: number; longitude: number },
  second: { latitude: number; longitude: number },
): number {
  const earthRadiusKilometers = 6371;
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const firstLatitude = toRadians(first.latitude);
  const secondLatitude = toRadians(second.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadiusKilometers * Math.asin(Math.sqrt(haversine));
}

function estimateTravelMinutesFromCoordinates(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): number {
  const straightLineDistance = getDistanceKilometers(from, to);
  const roadAdjustedDistance = straightLineDistance * 1.35;
  const rawMinutes = (roadAdjustedDistance / 32) * 60 + 8;
  return Math.min(210, Math.max(12, Math.round(rawMinutes / 5) * 5));
}

function getKnownLocation(locationId: string) {
  if (locationId === defaultItineraryStartLocation.id) {
    return defaultItineraryStartLocation;
  }
  return destinations.find((destination) => destination.id === locationId);
}

function getLocalTravelEstimate(fromId: string, toId: string): number | null {
  const destinationFromDenpasar =
    fromId === defaultItineraryStartLocation.id
      ? destinations.find((destination) => destination.id === toId)
      : toId === defaultItineraryStartLocation.id
        ? destinations.find((destination) => destination.id === fromId)
        : undefined;
  if (destinationFromDenpasar) {
    return destinationFromDenpasar.estimatedTravelMinutes;
  }

  const from = getKnownLocation(fromId);
  const to = getKnownLocation(toId);
  if (!from || !to) return null;

  return estimateTravelMinutesFromCoordinates(from, to);
}

export function getTravelMinutes(fromId: string | undefined, toId: string): number {
  if (!fromId || fromId === toId) return fromId === toId ? 12 : 45;
  return (
    travelMinutesByPair[pairKey(fromId, toId)] ??
    getLocalTravelEstimate(fromId, toId) ??
    60
  );
}

export function getTravelMinutesBetween(
  from: ItineraryLocation,
  to: ItineraryLocation,
): number {
  if (from.id && to.id) {
    if (from.id === to.id) return 12;
    const knownEstimate =
      travelMinutesByPair[pairKey(from.id, to.id)] ??
      getLocalTravelEstimate(from.id, to.id);
    if (knownEstimate !== null && knownEstimate !== undefined) {
      return knownEstimate;
    }
  }

  return estimateTravelMinutesFromCoordinates(from, to);
}
