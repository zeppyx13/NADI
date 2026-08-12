import { achievementDefinitions } from '@/data/achievements';
import { incentiveCampaigns } from '@/data/incentive-campaigns';
import {
  baseActivityAwards,
  baseImpactByActivity,
  INCENTIVE_SCHEMA_VERSION,
  levelDefinitions,
  perActivityCaps,
  pointsEarningVerifications,
  surpriseRewardPool,
} from '@/data/incentive-config';
import { rewardDefinitions } from '@/data/rewards';
import type {
  AchievementProgress,
  ActivityCommitResult,
  ActivityEvent,
  ImpactCounters,
  IncentiveCampaign,
  IncentiveState,
  LedgerEntry,
  LevelDefinition,
  LevelUpResult,
  RewardBreakdown,
  RewardDefinition,
  RewardEntitlement,
  UserProgress,
} from '@/types/incentive';

/**
 * The single source of truth for progression, rewards and impact.
 *
 * Home, Profile, Explore and the activity screen are all consumers. None of
 * them computes a balance, a level or an award; they read what this service
 * produced. There is no separate xp-service, points-service or impact-service.
 */

const emptyImpact: ImpactCounters = {
  alternativeVisits: 0,
  offPeakVisits: 0,
  localBusinessVisits: 0,
  distributionActions: 0,
  completedCampaigns: 0,
};

export function createInitialIncentiveState(localUserId: string): IncentiveState {
  return {
    schemaVersion: INCENTIVE_SCHEMA_VERSION,
    localUserId,
    progress: {
      totalXp: 0,
      acknowledgedLevel: 1,
      pointsBalance: 0,
      impact: { ...emptyImpact },
    },
    ledger: [],
    entitlements: [],
    committedEventIds: [],
    campaignClaimCounts: {},
  };
}

// ---------------------------------------------------------------------------
// Derivations
// ---------------------------------------------------------------------------

/** Level is always derived from XP; it is never independent state. */
export function deriveLevel(totalXp: number): LevelDefinition {
  return (
    [...levelDefinitions]
      .reverse()
      .find((definition) => totalXp >= definition.minimumXp) ??
    levelDefinitions[0]
  );
}

export function getNextLevel(totalXp: number): LevelDefinition | null {
  return (
    levelDefinitions.find((definition) => definition.minimumXp > totalXp) ?? null
  );
}

/** Balances are recomputed from the ledger rather than trusted as a stored number. */
export function deriveProgress(state: IncentiveState): UserProgress {
  const impact: ImpactCounters = { ...emptyImpact };
  let totalXp = 0;
  let pointsBalance = 0;

  state.ledger.forEach((entry) => {
    totalXp += entry.xpDelta;
    pointsBalance += entry.pointsDelta;
    (Object.keys(entry.impactDelta) as (keyof ImpactCounters)[]).forEach(
      (key) => {
        impact[key] += entry.impactDelta[key] ?? 0;
      },
    );
  });

  return {
    totalXp,
    acknowledgedLevel: state.progress.acknowledgedLevel,
    pointsBalance,
    impact,
  };
}

export function getAchievementProgress(
  state: IncentiveState,
): readonly AchievementProgress[] {
  const { impact } = deriveProgress(state);
  return achievementDefinitions.map((definition) => {
    const current = impact[definition.counter];
    return {
      definition,
      current,
      isUnlocked: current >= definition.target,
    };
  });
}

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

function parseClockMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  return Number.parseInt(match[1], 10) * 60 + Number.parseInt(match[2], 10);
}

function isWithinTimeWindow(
  occurredAt: string,
  window: { startsAt: string; endsAt: string },
): boolean {
  const moment = new Date(occurredAt);
  if (Number.isNaN(moment.getTime())) return false;
  const minutes = moment.getHours() * 60 + moment.getMinutes();
  const start = parseClockMinutes(window.startsAt);
  const end = parseClockMinutes(window.endsAt);
  if (start === null || end === null) return false;
  return minutes >= start && minutes <= end;
}

export function isCampaignRunning(
  campaign: IncentiveCampaign,
  at: Date = new Date(),
): boolean {
  const moment = at.getTime();
  return (
    moment >= new Date(campaign.startAt).getTime() &&
    moment <= new Date(campaign.endAt).getTime()
  );
}

/** Campaigns currently running for a destination or partner. */
export function getActiveCampaignsForTarget(
  targetType: IncentiveCampaign['targetType'],
  targetId: string,
  at: Date = new Date(),
): readonly IncentiveCampaign[] {
  return incentiveCampaigns.filter(
    (campaign) =>
      campaign.targetType === targetType &&
      campaign.targetId === targetId &&
      isCampaignRunning(campaign, at),
  );
}

export function getRunningCampaigns(
  at: Date = new Date(),
): readonly IncentiveCampaign[] {
  return incentiveCampaigns.filter((campaign) => isCampaignRunning(campaign, at));
}

type CampaignRejection = 'campaign-expired' | 'claim-limit' | null;

/**
 * Decides whether the event may claim the campaign. Every condition is typed;
 * nothing is parsed from free-form text.
 */
function evaluateCampaign(
  campaign: IncentiveCampaign,
  event: ActivityEvent,
  state: IncentiveState,
): CampaignRejection {
  if (!isCampaignRunning(campaign, new Date(event.occurredAt))) {
    return 'campaign-expired';
  }

  const { eligibility } = campaign;
  if (
    eligibility.requiredVerification &&
    !eligibility.requiredVerification.includes(event.verification)
  ) {
    return 'claim-limit';
  }
  if (
    eligibility.timeWindow &&
    !isWithinTimeWindow(event.occurredAt, eligibility.timeWindow)
  ) {
    return 'claim-limit';
  }

  const claims = state.campaignClaimCounts[campaign.id] ?? 0;
  if (claims >= eligibility.maxClaimsPerUser) return 'claim-limit';

  return null;
}

const impactByObjective: Record<
  IncentiveCampaign['objective'],
  keyof ImpactCounters
> = {
  'redistribute-visits': 'distributionActions',
  'off-peak-visit': 'offPeakVisits',
  'support-local-business': 'localBusinessVisits',
  'alternative-destination': 'alternativeVisits',
};

// ---------------------------------------------------------------------------
// Award calculation
// ---------------------------------------------------------------------------

function addImpact(
  target: Partial<ImpactCounters>,
  key: keyof ImpactCounters,
  amount: number,
): void {
  target[key] = (target[key] ?? 0) + amount;
}

/**
 * Explains an award end to end: base, bonus, multiplier, cap, final. The same
 * breakdown feeds the ledger and every screen.
 */
export function calculateAward(
  event: ActivityEvent,
  campaign: IncentiveCampaign | null,
): RewardBreakdown {
  const base = baseActivityAwards[event.type];
  const earnsPoints = pointsEarningVerifications.includes(event.verification);
  const basePoints = earnsPoints ? base.points : 0;

  const multiplier = campaign ? campaign.rewardMultiplier : 1;
  const bonusPoints = campaign && earnsPoints ? campaign.bonusPoints : 0;

  const rawXp = Math.round(base.xp * multiplier);
  const campaignXpCap = campaign ? campaign.maxXpPerClaim : perActivityCaps.maxXp;
  const cappedXp = Math.min(rawXp, campaignXpCap, perActivityCaps.maxXp);

  const rawPoints = basePoints + bonusPoints;
  const campaignPointsCap = campaign
    ? campaign.maxPointsPerClaim
    : perActivityCaps.maxPoints;
  const finalPoints = Math.min(
    rawPoints,
    campaignPointsCap,
    perActivityCaps.maxPoints,
  );

  const impactDelta: Partial<ImpactCounters> = {
    ...baseImpactByActivity[event.type],
  };
  if (campaign) {
    addImpact(impactDelta, impactByObjective[campaign.objective], 1);
    addImpact(impactDelta, 'completedCampaigns', 1);
  }

  return {
    baseXp: base.xp,
    bonusXp: cappedXp - base.xp,
    multiplier,
    cappedXp,
    finalXp: cappedXp,
    basePoints,
    bonusPoints,
    finalPoints,
    impactDelta,
    campaignId: campaign?.id,
    reasonCode: campaign ? 'campaign-bonus' : 'base-activity',
  };
}

// ---------------------------------------------------------------------------
// Rewards
// ---------------------------------------------------------------------------

export function getRewardDefinition(rewardId: string): RewardDefinition | null {
  return rewardDefinitions.find((reward) => reward.id === rewardId) ?? null;
}

/**
 * Deterministic pick from a stable seed. The same traveller at the same level
 * always receives the same surprise, so a demo replays identically and nothing
 * can be rerolled.
 */
function pickSurpriseReward(localUserId: string, level: number): string | undefined {
  if (surpriseRewardPool.length === 0) return undefined;
  const seed = `${localUserId}:${level}`;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 100_000;
  }
  return surpriseRewardPool[hash % surpriseRewardPool.length];
}

function createEntitlement(
  rewardId: string,
  sourceReason: RewardEntitlement['sourceReason'],
  grantedAt: string,
  sequence: number,
): RewardEntitlement | null {
  const definition = getRewardDefinition(rewardId);
  if (!definition) return null;

  const granted = new Date(grantedAt);
  const expires = new Date(granted);
  expires.setDate(expires.getDate() + definition.validityDays);

  return {
    id: `entitlement-${rewardId}-${granted.getTime()}-${sequence}`,
    rewardId,
    status: 'available',
    // Prototype code. No partner system validates it.
    code: `NADI-${rewardId.replace('reward-', '').toUpperCase().slice(0, 6)}-${granted.getTime().toString(36).toUpperCase()}`,
    grantedAt,
    expiresAt: expires.toISOString(),
    sourceReason,
  };
}

// ---------------------------------------------------------------------------
// Commit
// ---------------------------------------------------------------------------

function createLedgerId(state: IncentiveState, suffix: string): string {
  return `ledger-${state.ledger.length}-${suffix}`;
}

/**
 * Commits one activity as a single atomic domain change: XP, Points, Impact,
 * claim count and any level-up rewards move together or not at all.
 *
 * Idempotent by `event.id`. A repeated event — a double tap, a re-render, a
 * rescanned code, an app restart — never awards twice.
 */
export function commitActivity(
  state: IncentiveState,
  event: ActivityEvent,
): { state: IncentiveState; result: ActivityCommitResult } {
  if (state.committedEventIds.includes(event.id)) {
    return { state, result: { status: 'duplicate' } };
  }

  let campaign: IncentiveCampaign | null = null;
  let rejection: CampaignRejection = null;

  if (event.campaignId) {
    const candidate =
      incentiveCampaigns.find((item) => item.id === event.campaignId) ?? null;
    if (candidate) {
      rejection = evaluateCampaign(candidate, event, state);
      if (!rejection) campaign = candidate;
    }
  } else {
    // No campaign was named, so take the first running one that accepts it.
    const candidates = getActiveCampaignsForTarget(
      event.targetType === 'partner' ? 'partner' : 'destination',
      event.targetId,
      new Date(event.occurredAt),
    );
    for (const candidate of candidates) {
      if (!evaluateCampaign(candidate, event, state)) {
        campaign = candidate;
        break;
      }
    }
  }

  const breakdown = calculateAward(event, campaign);

  if (breakdown.finalXp === 0 && breakdown.finalPoints === 0) {
    return {
      state,
      result: {
        status: 'not-eligible',
        reason: rejection ?? 'no-rule',
      },
    };
  }

  const activityEntry: LedgerEntry = {
    id: createLedgerId(state, 'activity'),
    eventId: event.id,
    activityType: event.type,
    targetId: event.targetId,
    targetName: event.targetName,
    occurredAt: event.occurredAt,
    xpDelta: breakdown.finalXp,
    pointsDelta: breakdown.finalPoints,
    impactDelta: breakdown.impactDelta,
    reasonCode: breakdown.reasonCode,
    campaignId: breakdown.campaignId,
  };

  const ledger = [...state.ledger, activityEntry];
  const entitlements = [...state.entitlements];

  const previousLevel = deriveLevel(state.progress.totalXp).level;
  const totalXp = state.progress.totalXp + breakdown.finalXp;
  const nextLevelDefinition = deriveLevel(totalXp);
  let levelUp: LevelUpResult | null = null;

  if (nextLevelDefinition.level > previousLevel) {
    const milestoneRewardId = nextLevelDefinition.milestoneRewardId;
    const surpriseRewardId = pickSurpriseReward(
      state.localUserId,
      nextLevelDefinition.level,
    );

    if (milestoneRewardId) {
      const entitlement = createEntitlement(
        milestoneRewardId,
        'milestone',
        event.occurredAt,
        entitlements.length,
      );
      if (entitlement) {
        entitlements.push(entitlement);
        ledger.push({
          id: createLedgerId(state, 'milestone'),
          occurredAt: event.occurredAt,
          xpDelta: 0,
          pointsDelta: 0,
          impactDelta: {},
          reasonCode: 'level-milestone',
        });
      }
    }

    if (surpriseRewardId) {
      const entitlement = createEntitlement(
        surpriseRewardId,
        'surprise',
        event.occurredAt,
        entitlements.length,
      );
      if (entitlement) {
        entitlements.push(entitlement);
        ledger.push({
          id: createLedgerId(state, 'surprise'),
          occurredAt: event.occurredAt,
          xpDelta: 0,
          pointsDelta: 0,
          impactDelta: {},
          reasonCode: 'surprise-reward',
        });
      }
    }

    levelUp = {
      fromLevel: previousLevel,
      toLevel: nextLevelDefinition.level,
      milestoneRewardId,
      surpriseRewardId,
    };
  }

  const nextState: IncentiveState = {
    ...state,
    progress: {
      ...state.progress,
      totalXp,
      acknowledgedLevel: nextLevelDefinition.level,
      pointsBalance: state.progress.pointsBalance + breakdown.finalPoints,
      impact: applyImpact(state.progress.impact, breakdown.impactDelta),
    },
    ledger,
    entitlements,
    committedEventIds: [...state.committedEventIds, event.id],
    campaignClaimCounts: campaign
      ? {
          ...state.campaignClaimCounts,
          [campaign.id]: (state.campaignClaimCounts[campaign.id] ?? 0) + 1,
        }
      : state.campaignClaimCounts,
  };

  return { state: nextState, result: { status: 'awarded', breakdown, levelUp } };
}

function applyImpact(
  current: ImpactCounters,
  delta: Partial<ImpactCounters>,
): ImpactCounters {
  const next = { ...current };
  (Object.keys(delta) as (keyof ImpactCounters)[]).forEach((key) => {
    next[key] += delta[key] ?? 0;
  });
  return next;
}

// ---------------------------------------------------------------------------
// Redemption
// ---------------------------------------------------------------------------

export type RedemptionResult =
  | { status: 'claimed' }
  | { status: 'redeemed' }
  | { status: 'insufficient-points' }
  | { status: 'already-redeemed' }
  | { status: 'expired' }
  | { status: 'unknown-reward' };

/** Spends Points for a reward. The balance can never go negative. */
export function claimRewardWithPoints(
  state: IncentiveState,
  rewardId: string,
  at: string = new Date().toISOString(),
): { state: IncentiveState; result: RedemptionResult } {
  const definition = getRewardDefinition(rewardId);
  if (!definition) return { state, result: { status: 'unknown-reward' } };
  if (state.progress.pointsBalance < definition.pointsCost) {
    return { state, result: { status: 'insufficient-points' } };
  }

  const entitlement = createEntitlement(
    rewardId,
    'points-redemption',
    at,
    state.entitlements.length,
  );
  if (!entitlement) return { state, result: { status: 'unknown-reward' } };

  const pointsDelta = -definition.pointsCost + (definition.bonusPoints ?? 0);

  return {
    state: {
      ...state,
      progress: {
        ...state.progress,
        pointsBalance: state.progress.pointsBalance + pointsDelta,
      },
      entitlements: [...state.entitlements, entitlement],
      ledger: [
        ...state.ledger,
        {
          id: createLedgerId(state, 'redemption'),
          occurredAt: at,
          xpDelta: 0,
          pointsDelta,
          impactDelta: {},
          reasonCode: 'reward-redemption',
        },
      ],
    },
    result: { status: 'claimed' },
  };
}

/** Marks a claimed entitlement as used. A second attempt is rejected. */
export function redeemEntitlement(
  state: IncentiveState,
  entitlementId: string,
  at: string = new Date().toISOString(),
): { state: IncentiveState; result: RedemptionResult } {
  const entitlement = state.entitlements.find(
    (item) => item.id === entitlementId,
  );
  if (!entitlement) return { state, result: { status: 'unknown-reward' } };
  if (entitlement.status === 'redeemed') {
    return { state, result: { status: 'already-redeemed' } };
  }
  if (new Date(entitlement.expiresAt).getTime() < new Date(at).getTime()) {
    return { state, result: { status: 'expired' } };
  }

  return {
    state: {
      ...state,
      entitlements: state.entitlements.map((item) =>
        item.id === entitlementId
          ? { ...item, status: 'redeemed' as const, redeemedAt: at }
          : item,
      ),
    },
    result: { status: 'redeemed' },
  };
}

/** Entitlements with expiry applied, so status is never stale on screen. */
export function readEntitlements(
  state: IncentiveState,
  at: Date = new Date(),
): readonly RewardEntitlement[] {
  return state.entitlements.map((entitlement) =>
    entitlement.status !== 'redeemed' &&
    new Date(entitlement.expiresAt).getTime() < at.getTime()
      ? { ...entitlement, status: 'expired' as const }
      : entitlement,
  );
}
