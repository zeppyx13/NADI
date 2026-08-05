import { useCallback, useEffect, useState } from 'react';

import { loadHomeDashboard } from '@/mocks/home-dashboard';
import type { HomeDashboardData, HomeDashboardStatus } from '@/types/home';

type HomeDashboardState = {
  status: HomeDashboardStatus;
  data: HomeDashboardData | null;
};

function getReadyStatus(data: HomeDashboardData): HomeDashboardStatus {
  const hasAnyContent =
    data.recommendedDestinationIds.length > 0 ||
    data.nearbyDestinationIds.length > 0 ||
    data.featuredAlertId !== null ||
    data.localContextIds.length > 0;

  if (!hasAnyContent) return 'empty';

  const isPartial =
    data.recommendedDestinationIds.length === 0 ||
    data.nearbyDestinationIds.length === 0;

  return isPartial ? 'partial' : 'ready';
}

export function useHomeDashboard() {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<HomeDashboardState>({
    status: 'loading',
    data: null,
  });

  useEffect(() => {
    const requestController = new AbortController();

    void loadHomeDashboard(requestController.signal)
      .then((data) => {
        if (requestController.signal.aborted) return;
        setState({ status: getReadyStatus(data), data });
      })
      .catch(() => {
        if (requestController.signal.aborted) return;
        setState({ status: 'error', data: null });
      });

    return () => requestController.abort();
  }, [reloadKey]);

  const retry = useCallback(() => {
    setState({ status: 'loading', data: null });
    setReloadKey((current) => current + 1);
  }, []);

  return { ...state, retry };
}
