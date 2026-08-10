import { useRouter } from 'expo-router';
import {
  Bell,
  Clock3,
  Compass,
  Heart,
  Languages,
  LogOut,
  MapPinned,
  Route,
  ShieldCheck,
  UserRound,
} from 'lucide-react-native';
import { Alert, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { LanguageSelector } from '@/components/auth/language-selector';
import { MainScreenHeader } from '@/components/layout/main-screen-header';
import { ProfileMenuItem } from '@/components/profile/profile-menu-item';
import {
  AppButton,
  AppCard,
  AppText,
  Divider,
  ScreenContainer,
} from '@/components/ui';
import { colors, iconSizes, radii, spacing } from '@/constants/theme';

const travelMenuItems = [
  { key: 'myItineraries', icon: MapPinned },
  { key: 'favorites', icon: Heart },
  { key: 'history', icon: Clock3 },
] as const;

const preferenceMenuItems = [
  { key: 'tourismPreferences', icon: Compass },
  { key: 'routePreferences', icon: Route },
] as const;

const settingsMenuItems = [
  { key: 'notifications', icon: Bell },
  { key: 'locationPrivacy', icon: ShieldCheck },
] as const;

export default function ProfileScreen() {
  const { t } = useTranslation('screens');
  const router = useRouter();

  const showUnavailableNotice = () => {
    Alert.alert(t('common.soonTitle'), t('common.soonMessage'));
  };

  return (
    <ScreenContainer scroll style={styles.screen}>
      <MainScreenHeader
        title={t('profile.title')}
        subtitle={t('profile.subtitle')}
      />

      <View style={styles.profileSummary}>
        <View style={styles.avatar}>
          <UserRound size={iconSizes.empty} color={colors.neutral.white} />
        </View>
        <View style={styles.profileCopy}>
          <AppText variant="headingMd">{t('profile.name')}</AppText>
          <AppText variant="bodySm" color={colors.neutral.textSecondary}>
            {t('profile.email')}
          </AppText>
        </View>
      </View>

      <View style={styles.section}>
        <AppText
          variant="labelMd"
          color={colors.neutral.textSecondary}
          style={styles.sectionTitle}
        >
          {t('profile.travelTitle')}
        </AppText>
        <AppCard variant="outlined" style={styles.menuCard}>
          {travelMenuItems.map((item, index) => (
            <View key={item.key}>
              {index > 0 && <Divider spacing={0} />}
              <ProfileMenuItem
                icon={item.icon}
                label={t(`profile.menu.${item.key}`)}
                onPress={
                  item.key === 'myItineraries'
                    ? () => router.push('/itinerary')
                    : showUnavailableNotice
                }
              />
            </View>
          ))}
        </AppCard>
      </View>

      <View style={styles.section}>
        <AppText
          variant="labelMd"
          color={colors.neutral.textSecondary}
          style={styles.sectionTitle}
        >
          {t('profile.preferencesTitle')}
        </AppText>
        <AppCard variant="outlined" style={styles.menuCard}>
          {preferenceMenuItems.map((item, index) => (
            <View key={item.key}>
              {index > 0 && <Divider spacing={0} />}
              <ProfileMenuItem
                icon={item.icon}
                label={t(`profile.menu.${item.key}`)}
                onPress={showUnavailableNotice}
              />
            </View>
          ))}
        </AppCard>
      </View>

      <View style={styles.section}>
        <AppText
          variant="labelMd"
          color={colors.neutral.textSecondary}
          style={styles.sectionTitle}
        >
          {t('profile.settingsTitle')}
        </AppText>
        <AppCard variant="outlined" style={styles.menuCard}>
          <View style={styles.languageRow}>
            <View style={styles.languageIcon}>
              <Languages size={iconSizes.button} color={colors.brand[600]} />
            </View>
            <View style={styles.languageCopy}>
              <AppText variant="labelLg">{t('profile.menu.language')}</AppText>
              <AppText variant="caption" color={colors.neutral.textSecondary}>
                {t('profile.languageSubtitle')}
              </AppText>
            </View>
            <LanguageSelector />
          </View>
          <Divider spacing={0} />
          {settingsMenuItems.map((item, index) => (
            <View key={item.key}>
              {index > 0 && <Divider spacing={0} />}
              <ProfileMenuItem
                icon={item.icon}
                label={t(`profile.menu.${item.key}`)}
                onPress={showUnavailableNotice}
              />
            </View>
          ))}
        </AppCard>
      </View>

      <AppButton
        fullWidth
        variant="danger"
        label={t('profile.logout')}
        accessibilityLabel={t('profile.logoutAccessibility')}
        leadingIcon={
          <LogOut size={iconSizes.button} color={colors.semantic.danger.text} />
        }
        onPress={() => router.replace('/(auth)/login')}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
    gap: spacing[6],
  },
  profileSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    paddingHorizontal: spacing[2],
  },
  avatar: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.brand[600],
  },
  profileCopy: {
    flex: 1,
    gap: spacing[1],
  },
  section: {
    gap: spacing[2],
  },
  sectionTitle: {
    paddingHorizontal: spacing[2],
    textTransform: 'uppercase',
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  languageRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  languageIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    backgroundColor: colors.brand[50],
  },
  languageCopy: {
    flex: 1,
    gap: 2,
  },
});
