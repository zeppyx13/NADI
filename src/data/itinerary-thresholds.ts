export const itineraryDecisionThresholds = {
  occupancy: {
    moderate: 0.55,
    high: 0.75,
    critical: 0.9,
  },
  alternative: {
    minimumSimilarity: 0.7,
    maximumPredictedLoad: 0.7,
  },
  rescheduleMinutes: 120,
} as const;
