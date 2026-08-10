import type { OccupancyLevel } from '@/constants/theme';

export type DestinationCategory =
  | 'beach'
  | 'culture'
  | 'nature'
  | 'spiritual'
  | 'culinary'
  | 'village';

export type IntelligenceCoverage = 'pilot' | 'catalog' | 'custom';

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
  regency: string;
  category: DestinationCategory;
  tags: readonly string[];
  imageQuery: string;
  latitude: number;
  longitude: number;
  suggestedVisitMinutes: number;
  intelligenceCoverage: Exclude<IntelligenceCoverage, 'custom'>;
  occupancyLevel?: OccupancyLevel;
  estimatedTravelMinutes: number;
  recommendationReasonKey?: DestinationRecommendationKey;
};
