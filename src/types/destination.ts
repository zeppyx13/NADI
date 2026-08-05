import type { OccupancyLevel } from '@/constants/theme';

export type DestinationCategory = 'beach' | 'culture' | 'nature' | 'spiritual' | 'culinary';

export type DestinationRecommendationKey =
  | 'centralAccess'
  | 'culturalExperience'
  | 'balancedVisit'
  | 'quieterCoast'
  | 'spiritualJourney';

export type Destination = {
  id: string;
  name: string;
  region: string;
  category: DestinationCategory;
  imageQuery: string;
  latitude: number;
  longitude: number;
  occupancyLevel: OccupancyLevel;
  estimatedTravelMinutes: number;
  recommendationReasonKey: DestinationRecommendationKey;
};
