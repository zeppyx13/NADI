import { ChevronRight, RefreshCw } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui';
import { colors, iconSizes, radii, spacing } from '@/constants/theme';

export type ReoptimizationBannerProps = {
  actionLabel: string;
  onPress: () => void;
};

/**
 * Sits above whichever detail panel is open so a pending itinerary change stays
 * reachable while the user inspects an incident or a monitoring point.
 */
export function ReoptimizationBanner({
  actionLabel,
  onPress,
}: ReoptimizationBannerProps) {
  const { t } = useTranslation('screens');

  return (
    <View style={styles.banner}>
      <RefreshCw size={iconSizes.button} color={colors.semantic.warning.text} />
      <AppText
        variant="labelMd"
        color={colors.semantic.warning.text}
        style={styles.copy}
      >
        {t('map.pendingRecommendation')}
      </AppText>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
      >
        <AppText variant="labelMd" color={colors.semantic.warning.text}>
          {actionLabel}
        </AppText>
        <ChevronRight
          size={iconSizes.inline}
          color={colors.semantic.warning.text}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingLeft: spacing[3],
    paddingRight: spacing[2],
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.semantic.warning.main,
    backgroundColor: colors.semantic.warning.bg,
  },
  copy: {
    flex: 1,
  },
  action: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    borderRadius: radii.sm,
  },
  actionPressed: {
    opacity: 0.72,
  },
});
