import type { HomeDashboardData } from '@/types/home';

export const homeDashboardData: HomeDashboardData = {
  user: {
    name: 'Made',
    currentArea: 'Denpasar, Bali',
  },
  conditionSummary: {
    status: 'moderate',
    crowdedAreaCount: 2,
    activeIncidentCount: 1,
    nearbyDestinationCount: 5,
    updatedAt: '2026-08-05T08:45:00+08:00',
  },
  featuredAlertId: 'incident-denpasar-01',
  featuredAlertDistanceKm: 2.4,
  activeJourney: null,
  recommendedDestinationIds: ['ubud', 'tanah-lot', 'pura-besakih'],
  nearbyDestinationIds: ['pantai-kuta', 'ubud', 'tanah-lot'],
  localContextIds: ['event-ubud-01'],
  destinationInsights: [
    {
      destinationId: 'pantai-kuta',
      distanceKm: 12.4,
      etaMinutes: 28,
      predictedOccupancyLevel: 'critical',
      recommendationReason: 'smootherAccess',
    },
    {
      destinationId: 'ubud',
      distanceKm: 28.7,
      etaMinutes: 44,
      predictedOccupancyLevel: 'moderate',
      recommendationReason: 'culturalPreference',
    },
    {
      destinationId: 'tanah-lot',
      distanceKm: 31.6,
      etaMinutes: 51,
      predictedOccupancyLevel: 'moderate',
      recommendationReason: 'lowerRouteRisk',
    },
    {
      destinationId: 'pantai-lovina',
      distanceKm: 82.5,
      etaMinutes: 132,
      predictedOccupancyLevel: 'low',
      recommendationReason: 'lowerArrivalOccupancy',
    },
    {
      destinationId: 'pura-besakih',
      distanceKm: 54.8,
      etaMinutes: 87,
      predictedOccupancyLevel: 'low',
      recommendationReason: 'parkingAvailable',
    },
  ],
};
