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

export function getTravelMinutes(fromId: string | undefined, toId: string): number {
  if (!fromId || fromId === toId) return fromId === toId ? 12 : 45;
  return travelMinutesByPair[pairKey(fromId, toId)] ?? 60;
}
