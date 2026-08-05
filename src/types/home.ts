import type { OccupancyLevel, RouteMode } from '@/constants/theme';

export type TravelConditionStatus = 'smooth' | 'moderate' | 'attention';

export type TravelConditionSummary = {
  status: TravelConditionStatus;
  crowdedAreaCount: number;
  activeIncidentCount: number;
  nearbyDestinationCount: number;
  updatedAt: string;
};

export type JourneyStatus = 'smooth' | 'moderate' | 'disrupted';

export type ActiveJourney = {
  id: string;
  destinationId: string;
  destinationName: string;
  etaMinutes: number;
  distanceKm: number;
  routeMode: RouteMode;
  status: JourneyStatus;
};

export type HomeRecommendationReason =
  | 'lowerArrivalOccupancy'
  | 'smootherAccess'
  | 'culturalPreference'
  | 'lowerRouteRisk'
  | 'parkingAvailable';

export type HomeDestinationInsight = {
  destinationId: string;
  distanceKm: number;
  etaMinutes: number;
  predictedOccupancyLevel: OccupancyLevel;
  recommendationReason: HomeRecommendationReason;
};

export type HomeDashboardData = {
  user: {
    name: string;
    currentArea: string;
  };
  conditionSummary: TravelConditionSummary;
  featuredAlertId: string | null;
  featuredAlertDistanceKm: number | null;
  activeJourney: ActiveJourney | null;
  recommendedDestinationIds: readonly string[];
  nearbyDestinationIds: readonly string[];
  localContextIds: readonly string[];
  destinationInsights: readonly HomeDestinationInsight[];
};

export type HomeDashboardStatus =
  | 'loading'
  | 'ready'
  | 'partial'
  | 'empty'
  | 'error';
