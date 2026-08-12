/**
 * NADI Incentive & Impact System.
 *
 * Game mechanics are the instrument, not the point. NADI rewards travel that
 * helps spread visits more evenly and widens local economic benefit — never the
 * mere act of opening the app.
 *
 * Three units, deliberately separate:
 *   XP     → progression only, never spendable
 *   Points → the only spendable currency
 *   Impact → contribution counters, never spendable
 */

// ---------------------------------------------------------------------------
// Activity
// ---------------------------------------------------------------------------

export type IncentiveActivityType =
  /** A stop the traveller actually reached and completed. */
  | 'destination-visit'
  /** A check-in at a partner business. */
  | 'partner-visit'
  /** An adaptive recommendation the traveller accepted, before any visit. */
  | 'recommendation-accepted'
  /** A whole itinerary finished. */
  | 'itinerary-completed';

/** How NADI established that the activity really happened. */
export type VerificationMethod =
  | 'qr-check-in'
  | 'journey-arrival'
  | 'itinerary-completion'
  /** In-app action with no physical presence; earns engagement XP only. */
  | 'in-app-action';

export type IncentiveTargetType = 'destination' | 'partner' | 'itinerary';

export type ActivityEvent = {
  /** Stable idempotency key. One event id awards at most once, ever. */
  id: string;
  type: IncentiveActivityType;
  targetType: IncentiveTargetType;
  targetId: string;
  targetName: string;
  verification: VerificationMethod;
  occurredAt: string;
  /** Campaign the traveller was acting under, when one applied. */
  campaignId?: string;
};

// ---------------------------------------------------------------------------
// Progression
// ---------------------------------------------------------------------------

export type LevelDefinition = {
  level: number;
  /** Cumulative XP needed to reach this level. */
  minimumXp: number;
  nameKey: string;
  /** Reward granted on reaching this level. Always granted when defined. */
  milestoneRewardId?: string;
};

export type ImpactCounters = {
  alternativeVisits: number;
  offPeakVisits: number;
  localBusinessVisits: number;
  distributionActions: number;
  completedCampaigns: number;
};

export type UserProgress = {
  totalXp: number;
  /** Derived from XP, stored only to detect a level-up once. */
  acknowledgedLevel: number;
  pointsBalance: number;
  impact: ImpactCounters;
};

// ---------------------------------------------------------------------------
// Campaign
// ---------------------------------------------------------------------------

export type CampaignObjective =
  | 'redistribute-visits'
  | 'off-peak-visit'
  | 'support-local-business'
  | 'alternative-destination';

/**
 * Typed eligibility. Never a free-form string parsed by the UI.
 */
export type CampaignEligibility = {
  /** Local clock window, `HH:MM`, when the visit must happen. */
  timeWindow?: { startsAt: string; endsAt: string };
  /** Verification methods that satisfy this campaign. */
  requiredVerification?: readonly VerificationMethod[];
  /** Times a single traveller may claim this campaign. */
  maxClaimsPerUser: number;
};

export type IncentiveCampaign = {
  id: string;
  targetType: IncentiveTargetType;
  targetId: string;
  objective: CampaignObjective;
  titleKey: string;
  descriptionKey: string;
  startAt: string;
  endAt: string;
  /** Applied to the base award. 1 means no multiplier. */
  rewardMultiplier: number;
  bonusPoints: number;
  eligibility: CampaignEligibility;
  /** Hard ceilings so a campaign cannot be farmed. */
  maxXpPerClaim: number;
  maxPointsPerClaim: number;
};

// ---------------------------------------------------------------------------
// Rewards
// ---------------------------------------------------------------------------

export type RewardKind =
  | 'parking-voucher'
  | 'partner-discount'
  | 'local-perk'
  | 'bonus-points';

export type RewardDefinition = {
  id: string;
  kind: RewardKind;
  titleKey: string;
  descriptionKey: string;
  /** Points required to claim. Zero for milestone and surprise rewards. */
  pointsCost: number;
  partnerId?: string;
  validityDays: number;
  /** Bonus points granted when the reward itself is points. */
  bonusPoints?: number;
};

export type RewardStatus = 'available' | 'claimed' | 'redeemed' | 'expired';

export type RewardEntitlement = {
  id: string;
  rewardId: string;
  status: RewardStatus;
  /** Local voucher code. Prototype only; no partner system backs it. */
  code: string;
  grantedAt: string;
  expiresAt: string;
  redeemedAt?: string;
  /** Why the traveller has it: a milestone, a surprise, or a purchase. */
  sourceReason: 'milestone' | 'surprise' | 'points-redemption';
};

// ---------------------------------------------------------------------------
// Ledger
// ---------------------------------------------------------------------------

export type LedgerReasonCode =
  | 'base-activity'
  | 'campaign-bonus'
  | 'level-milestone'
  | 'surprise-reward'
  | 'reward-redemption';

/**
 * Every change to XP, Points or Impact leaves an entry. The balance is derived
 * from this ledger rather than trusted as a stored number.
 */
export type LedgerEntry = {
  id: string;
  /** The `ActivityEvent.id` that produced this entry, when there was one. */
  eventId?: string;
  activityType?: IncentiveActivityType;
  targetId?: string;
  targetName?: string;
  occurredAt: string;
  xpDelta: number;
  pointsDelta: number;
  impactDelta: Partial<ImpactCounters>;
  reasonCode: LedgerReasonCode;
  campaignId?: string;
};

// ---------------------------------------------------------------------------
// Partners and achievements
// ---------------------------------------------------------------------------

export type PartnerCategory = 'culinary' | 'craft' | 'guide' | 'retail';

export type PartnerBusiness = {
  id: string;
  name: string;
  category: PartnerCategory;
  area: string;
  /** Destination this partner sits near, used for local discovery. */
  nearDestinationId?: string;
  latitude: number;
  longitude: number;
  perkKey: string;
};

export type AchievementDefinition = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  /** Impact counter that drives progress. */
  counter: keyof ImpactCounters;
  target: number;
};

export type AchievementProgress = {
  definition: AchievementDefinition;
  current: number;
  isUnlocked: boolean;
};

// ---------------------------------------------------------------------------
// Award calculation
// ---------------------------------------------------------------------------

/**
 * A fully explained award. Home, Profile and detail screens all read this same
 * shape, so a number can never differ between them.
 */
export type RewardBreakdown = {
  baseXp: number;
  bonusXp: number;
  multiplier: number;
  cappedXp: number;
  finalXp: number;
  basePoints: number;
  bonusPoints: number;
  finalPoints: number;
  impactDelta: Partial<ImpactCounters>;
  campaignId?: string;
  reasonCode: LedgerReasonCode;
};

export type ActivityCommitResult =
  | { status: 'awarded'; breakdown: RewardBreakdown; levelUp: LevelUpResult | null }
  /** The same event was already committed; nothing changed. */
  | { status: 'duplicate' }
  /** Verified, but no rule granted anything. */
  | { status: 'not-eligible'; reason: 'campaign-expired' | 'claim-limit' | 'no-rule' };

export type LevelUpResult = {
  fromLevel: number;
  toLevel: number;
  milestoneRewardId?: string;
  surpriseRewardId?: string;
};

// ---------------------------------------------------------------------------
// Persisted state
// ---------------------------------------------------------------------------

export type IncentiveState = {
  /** Bumped when the persisted shape changes; older payloads are discarded. */
  schemaVersion: number;
  /** Stable local identity, independent of the dummy auth email. */
  localUserId: string;
  progress: UserProgress;
  ledger: LedgerEntry[];
  entitlements: RewardEntitlement[];
  /** Event ids already committed, the idempotency guard. */
  committedEventIds: string[];
  /** Claims per campaign, enforcing `maxClaimsPerUser`. */
  campaignClaimCounts: Record<string, number>;
};
