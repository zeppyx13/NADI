import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  claimRewardWithPoints,
  commitActivity,
  createInitialIncentiveState,
  deriveLevel,
  deriveProgress,
  getAchievementProgress,
  getNextLevel,
  readEntitlements,
  redeemEntitlement,
  type RedemptionResult,
} from '@/services/incentive-service';
import {
  readIncentiveState,
  writeIncentiveState,
} from '@/storage/incentive-storage';
import type {
  AchievementProgress,
  ActivityCommitResult,
  ActivityEvent,
  IncentiveState,
  LevelDefinition,
  RewardEntitlement,
  UserProgress,
} from '@/types/incentive';

/**
 * The one store for progression, rewards and impact. Screens read from here and
 * never keep their own copy of a balance or a level.
 */
type IncentiveContextValue = {
  isHydrated: boolean;
  progress: UserProgress;
  level: LevelDefinition;
  nextLevel: LevelDefinition | null;
  entitlements: readonly RewardEntitlement[];
  achievements: readonly AchievementProgress[];
  state: IncentiveState;
  /** Commits one activity. Idempotent by `event.id`. */
  recordActivity: (event: ActivityEvent) => Promise<ActivityCommitResult>;
  claimReward: (rewardId: string) => Promise<RedemptionResult>;
  redeemEntitlementById: (entitlementId: string) => Promise<RedemptionResult>;
};

const IncentiveContext = createContext<IncentiveContextValue | null>(null);

export function IncentiveProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<IncentiveState>(() =>
    createInitialIncentiveState('local-pending'),
  );
  const [isHydrated, setIsHydrated] = useState(false);
  /**
   * Mirrors the latest state so a commit always builds on the newest ledger,
   * even when two activities land in the same tick. Only hydration and `persist`
   * ever write it, which keeps it in step with the state it shadows.
   */
  const stateRef = useRef(state);

  useEffect(() => {
    let cancelled = false;
    void readIncentiveState().then((stored) => {
      if (cancelled) return;
      stateRef.current = stored;
      setState(stored);
      setIsHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: IncentiveState) => {
    stateRef.current = next;
    setState(next);
    void writeIncentiveState(next);
  }, []);

  const recordActivity = useCallback(
    async (event: ActivityEvent): Promise<ActivityCommitResult> => {
      const { state: next, result } = commitActivity(stateRef.current, event);
      // XP, Points, Impact and the claim count move together or not at all.
      if (result.status === 'awarded') persist(next);
      return result;
    },
    [persist],
  );

  const claimReward = useCallback(
    async (rewardId: string): Promise<RedemptionResult> => {
      const { state: next, result } = claimRewardWithPoints(
        stateRef.current,
        rewardId,
      );
      if (result.status === 'claimed') persist(next);
      return result;
    },
    [persist],
  );

  const redeemEntitlementById = useCallback(
    async (entitlementId: string): Promise<RedemptionResult> => {
      const { state: next, result } = redeemEntitlement(
        stateRef.current,
        entitlementId,
      );
      if (result.status === 'redeemed') persist(next);
      return result;
    },
    [persist],
  );

  const value = useMemo<IncentiveContextValue>(() => {
    const progress = deriveProgress(state);
    return {
      isHydrated,
      progress,
      level: deriveLevel(progress.totalXp),
      nextLevel: getNextLevel(progress.totalXp),
      entitlements: readEntitlements(state),
      achievements: getAchievementProgress(state),
      state,
      recordActivity,
      claimReward,
      redeemEntitlementById,
    };
  }, [claimReward, isHydrated, recordActivity, redeemEntitlementById, state]);

  return (
    <IncentiveContext.Provider value={value}>
      {children}
    </IncentiveContext.Provider>
  );
}

export function useIncentive(): IncentiveContextValue {
  const context = useContext(IncentiveContext);
  if (!context) {
    throw new Error('useIncentive must be used within IncentiveProvider.');
  }
  return context;
}
