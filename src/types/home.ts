import type { OccupancyLevel } from '@/constants/theme';

export type TravelConditionStatus = 'smooth' | 'moderate' | 'attention';

export type TravelConditionSummary = {
  status: TravelConditionStatus;
  crowdedAreaCount: number;
  activeIncidentCount: number;
  nearbyDestinationCount: number;
  updatedAt: string;
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
