import { useTranslation } from 'react-i18next';

import { AppBadge } from '@/components/ui';
import type { ItineraryStatus } from '@/types/itinerary';

export function ItineraryStatusBadge({ status }: { status: ItineraryStatus }) {
  const { t } = useTranslation('itinerary');
  const variant =
    status === 'active'
      ? 'success'
      : status === 'completed'
        ? 'neutral'
        : status === 'cancelled'
          ? 'danger'
          : status === 'suggested'
            ? 'warning'
            : 'info';

  return <AppBadge size="sm" variant={variant} label={t(`status.${status}`)} />;
}
