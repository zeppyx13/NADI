import type {
  ImpactCounters,
  IncentiveActivityType,
  LevelDefinition,
  VerificationMethod,
} from '@/types/incentive';

/**
 * Every reward number lives here. No screen and no component computes an award.
 *
 * The base awards deliberately do not scale with how empty a destination is.
 * Rewarding emptiness alone would just move the crowd somewhere else and create
 * the next hotspot; a bonus only ever comes from a campaign, which is where
 * capacity, timing and policy are weighed.
 */

export const INCENTIVE_SCHEMA_VERSION = 1;

/** Base award per activity, before any campaign is considered. */
export const baseActivityAwards: Record<
  IncentiveActivityType,
  { xp: number; points: number }
> = {
  'destination-visit': { xp: 50, points: 10 },
  'partner-visit': { xp: 40, points: 20 },
  // Accepting advice is engagement, not a visit: XP only, and a small amount.
  'recommendation-accepted': { xp: 10, points: 0 },
  'itinerary-completed': { xp: 80, points: 0 },
};

/**
 * Verification methods strong enough to earn Points. A tap in the app never is.
 */
export const pointsEarningVerifications: readonly VerificationMethod[] = [
  'qr-check-in',
  'journey-arrival',
];

/** Impact counters credited per activity, before campaign objectives. */
export const baseImpactByActivity: Record<
  IncentiveActivityType,
  Partial<ImpactCounters>
> = {
  'destination-visit': {},
  'partner-visit': { localBusinessVisits: 1 },
  'recommendation-accepted': { distributionActions: 1 },
  'itinerary-completed': {},
};

/** Global ceiling for a single activity, whatever the campaign says. */
export const perActivityCaps = {
  maxXp: 200,
  maxPoints: 60,
} as const;

/**
 * Five levels, cumulative XP, each with a guaranteed milestone reward. Level is
 * always derived from XP; it is never stored as independent state.
 */
export const levelDefinitions: readonly LevelDefinition[] = [
  { level: 1, minimumXp: 0, nameKey: 'incentive.level.1' },
  {
    level: 2,
    minimumXp: 150,
    nameKey: 'incentive.level.2',
    milestoneRewardId: 'reward-parking-voucher',
  },
  {
    level: 3,
    minimumXp: 400,
    nameKey: 'incentive.level.3',
    milestoneRewardId: 'reward-partner-discount',
  },
  {
    level: 4,
    minimumXp: 800,
    nameKey: 'incentive.level.4',
    milestoneRewardId: 'reward-local-perk',
  },
  {
    level: 5,
    minimumXp: 1_500,
    nameKey: 'incentive.level.5',
    milestoneRewardId: 'reward-bonus-points',
  },
];

/**
 * Surprise rewards are an engagement bonus, never the main prize, never bought,
 * and never random at runtime: the pick comes from a stable seed so the same
 * traveller at the same level always sees the same bonus.
 */
export const surpriseRewardPool: readonly string[] = [
  'reward-bonus-points',
  'reward-local-perk',
];

/** Timezone the campaign windows are written in. */
export const incentiveTimeZone = 'Asia/Makassar';
