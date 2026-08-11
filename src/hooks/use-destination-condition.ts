import { useEffect, useState } from 'react';

import {
  destinationConditionService,
  type DestinationArrivalCondition,
} from '@/services/destination-condition-service';
import type { Destination } from '@/types/destination';

/**
 * Resolves the current and predicted-at-arrival condition of a destination.
 * Returns null while no destination is selected or no travel time is known.
 */
export function useDestinationCondition(
  destination?: Destination,
  travelMinutes?: number,
): DestinationArrivalCondition | null {
  const [condition, setCondition] =
    useState<DestinationArrivalCondition | null>(null);

  const requestKey =
    destination && travelMinutes !== undefined
      ? `${destination.id}:${Math.round(travelMinutes)}`
      : null;

  useEffect(() => {
    if (!destination || travelMinutes === undefined || !requestKey) return;

    let cancelled = false;
    void destinationConditionService
      .getArrivalCondition(destination, travelMinutes)
      .then((resolved) => {
        if (!cancelled) setCondition(resolved);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
    // `requestKey` covers the destination id and the rounded travel time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  return condition?.destinationId === destination?.id ? condition : null;
}
