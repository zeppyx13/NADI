import { homeDashboardData } from '@/data/home';
import type { HomeDashboardData } from '@/types/home';

const HOME_LOADING_DELAY_MS = 180;

export function loadHomeDashboard(
  signal?: AbortSignal,
): Promise<HomeDashboardData> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Home dashboard request was cancelled.'));
      return;
    }

    const handleAbort = () => {
      clearTimeout(timeout);
      reject(new Error('Home dashboard request was cancelled.'));
    };
    const timeout = setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort);
      resolve(homeDashboardData);
    }, HOME_LOADING_DELAY_MS);

    signal?.addEventListener('abort', handleAbort, { once: true });
  });
}
