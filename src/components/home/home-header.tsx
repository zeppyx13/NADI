import { Bell } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MainScreenHeader } from '@/components/layout/main-screen-header';
import { AppText, IconButton } from '@/components/ui';
import { colors, iconSizes, radii, spacing } from '@/constants/theme';

export type HomeHeaderProps = {
  name: string;
  currentArea: string;
  unreadAlertCount: number;
  onOpenAlerts: () => void;
};

export function HomeHeader({
  name,
  currentArea,
  unreadAlertCount,
  onOpenAlerts,
}: HomeHeaderProps) {
  const { t } = useTranslation('home');
  const notificationLabel =
    unreadAlertCount > 0
      ? t('notificationsWithCount', { count: unreadAlertCount })
      : t('notifications');

  return (
    <MainScreenHeader
      eyebrow={currentArea}
      title={t('greeting', { name })}
      rightAction={
        <View style={styles.notificationAction}>
          <IconButton
            variant="soft"
            accessibilityLabel={notificationLabel}
            icon={<Bell size={iconSizes.header} color={colors.brand[700]} />}
            onPress={onOpenAlerts}
          />
          {unreadAlertCount > 0 && (
            <View style={styles.unreadBadge} accessible={false}>
              <AppText variant="micro" color={colors.neutral.white}>
                {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
              </AppText>
            </View>
          )}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  notificationAction: {
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: -spacing[1],
    right: -spacing[1],
    minWidth: 20,
    height: 20,
    paddingHorizontal: spacing[1],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.neutral.surfaceSoft,
    backgroundColor: colors.semantic.danger.main,
  },
});
