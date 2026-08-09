import type {
  ItineraryRecommendationType,
  RecommendationExplanation,
} from '@/types/itinerary';

export type RecommendationExplanationInput = {
  type: ItineraryRecommendationType;
  destinationName: string;
  originalTime?: string;
  proposedTime?: string;
  replacementName?: string;
};

export interface ItineraryNarrativeService {
  explainRecommendation(
    input: RecommendationExplanationInput,
  ): Promise<RecommendationExplanation>;
}

export class LocalItineraryNarrativeService implements ItineraryNarrativeService {
  async explainRecommendation(
    input: RecommendationExplanationInput,
  ): Promise<RecommendationExplanation> {
    return {
      key: input.type,
      destinationName: input.destinationName,
      originalTime: input.originalTime,
      proposedTime: input.proposedTime,
      replacementName: input.replacementName,
    };
  }
}
