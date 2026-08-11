import { useEffect, useState } from 'react';

import { routeService } from '@/services/route-service';
import type { RouteEndpoint, RouteResult } from '@/types/route';

export type RoutePreviewState = {
  result: RouteResult | null;
  isLoading: boolean;
};

function endpointKey(endpoint?: RouteEndpoint): string {
  if (!endpoint) return 'none';
  return `${endpoint.id}:${endpoint.latitude.toFixed(5)}:${endpoint.longitude.toFixed(5)}`;
}

/**
 * Computes route candidates for the current origin and destination. Requests
 * only run when both endpoints exist, and a new pair aborts the previous call.
 */
export function useRoutePreview(
  origin?: RouteEndpoint,
  destination?: RouteEndpoint,
): RoutePreviewState {
  const [result, setResult] = useState<RouteResult | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const requestKey =
    origin && destination
      ? `${endpointKey(origin)}->${endpointKey(destination)}`
      : null;

  useEffect(() => {
    if (!origin || !destination || !requestKey) return;

    const controller = new AbortController();
    void routeService
      .computeRoutes({ origin, destination }, controller.signal)
      .then((computed) => {
        if (controller.signal.aborted) return;
        setResult(computed);
        setLoadedKey(requestKey);
      })
      .catch(() => undefined);

    return () => controller.abort();
    // `requestKey` captures every meaningful change of both endpoints.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const isCurrent = requestKey !== null && loadedKey === requestKey;

  return {
    result: isCurrent ? result : null,
    isLoading: requestKey !== null && !isCurrent,
  };
}
