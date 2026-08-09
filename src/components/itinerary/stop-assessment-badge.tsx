import { CircleCheck, CircleX, Info, TriangleAlert } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { AppBadge } from '@/components/ui';
import { colors, iconSizes } from '@/constants/theme';
import type { StopAssessmentStatus } from '@/types/itinerary';

export function StopAssessmentBadge({ status }: { status: StopAssessmentStatus }) {
  const { t } = useTranslation('itinerary');
  if (status === 'optimal') {
    return (
      <AppBadge
        size="sm"
        variant="success"
        label={t(`assessment.${status}`)}
        icon={<CircleCheck size={iconSizes.inline} color={colors.semantic.success.text} />}
      />
    );
  }
  if (status === 'acceptable') {
    return (
      <AppBadge
        size="sm"
        variant="info"
        label={t(`assessment.${status}`)}
        icon={<Info size={iconSizes.inline} color={colors.semantic.info.text} />}
      />
    );
  }
  if (status === 'adjustment-recommended') {
    return (
      <AppBadge
        size="sm"
        variant="warning"
        label={t(`assessment.${status}`)}
        icon={<TriangleAlert size={iconSizes.inline} color={colors.semantic.warning.text} />}
      />
    );
  }
  return (
    <AppBadge
      size="sm"
      variant="danger"
      label={t(`assessment.${status}`)}
      icon={<CircleX size={iconSizes.inline} color={colors.semantic.danger.text} />}
    />
  );
}
