import { ChevronLeft } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText, IconButton } from '@/components/ui';
import { colors, iconSizes, spacing } from '@/constants/theme';

export type ItineraryScreenHeaderProps = {
  title: string;
  subtitle?: string;
  backLabel: string;
  onBack: () => void;
};

export function ItineraryScreenHeader({
  title,
  subtitle,
  backLabel,
  onBack,
}: ItineraryScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <IconButton
        variant="default"
        accessibilityLabel={backLabel}
        icon={<ChevronLeft size={iconSizes.header} color={colors.brand[700]} />}
        onPress={onBack}
      />
      <View style={styles.copy}>
        <AppText variant="headingLg">{title}</AppText>
        {subtitle && (
          <AppText variant="bodySm" color={colors.neutral.textSecondary}>
            {subtitle}
          </AppText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  copy: {
    flex: 1,
    gap: spacing[1],
    paddingTop: spacing[2],
  },
});
