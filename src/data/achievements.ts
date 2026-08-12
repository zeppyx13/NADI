import type { AchievementDefinition } from '@/types/incentive';

/**
 * A short list on purpose. Progress is derived from impact counters, so an
 * achievement can always explain which real activity moved it.
 */
export const achievementDefinitions: readonly AchievementDefinition[] = [
  {
    id: 'achievement-balanced-explorer',
    titleKey: 'incentive.achievements.balancedExplorer.title',
    descriptionKey: 'incentive.achievements.balancedExplorer.description',
    counter: 'alternativeVisits',
    target: 3,
  },
  {
    id: 'achievement-off-peak',
    titleKey: 'incentive.achievements.offPeak.title',
    descriptionKey: 'incentive.achievements.offPeak.description',
    counter: 'offPeakVisits',
    target: 2,
  },
  {
    id: 'achievement-local-supporter',
    titleKey: 'incentive.achievements.localSupporter.title',
    descriptionKey: 'incentive.achievements.localSupporter.description',
    counter: 'localBusinessVisits',
    target: 3,
  },
  {
    id: 'achievement-adaptive-traveller',
    titleKey: 'incentive.achievements.adaptiveTraveller.title',
    descriptionKey: 'incentive.achievements.adaptiveTraveller.description',
    counter: 'distributionActions',
    target: 3,
  },
];
