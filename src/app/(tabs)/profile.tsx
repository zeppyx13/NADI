import { useRouter } from 'expo-router';
import {
  Bell,
  Clock3,
  Compass,
  Heart,
  Languages,
  LocateFixed,
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
  SectionHeader,
} from '@/components/ui';
import { colors, iconSizes, radii, spacing } from '@/constants/theme';

const travelSettings = [
  { key: 'tourismPreferences', icon: Compass },
  { key: 'routePreferences', icon: Route },
  { key: 'favorites', icon: Heart },
  { key: 'history', icon: Clock3 },
] as const;

const accountSettings = [
  { key: 'editProfile', icon: UserRound },
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

      <AppCard variant="elevated" style={styles.profileCard}>
        <View style={styles.avatar}>
          <UserRound size={iconSizes.empty} color={colors.neutral.white} />
        </View>
        <View style={styles.profileCopy}>
          <AppText variant="headingMd">{t('profile.name')}</AppText>
          <AppText variant="bodySm" color={colors.neutral.textSecondary}>
            {t('profile.email')}
          </AppText>
        </View>
      </AppCard>

      <AppCard style={styles.statsCard}>
        <View style={styles.stat}>
          <Heart size={iconSizes.button} color={colors.brand[600]} />
          <AppText variant="headingSm">12</AppText>
          <AppText
            variant="caption"
            color={colors.neutral.textSecondary}
            style={styles.statLabel}
          >
            {t('profile.stats.favorites')}
          </AppText>
        </View>
        <Divider orientation="vertical" />
        <View style={styles.stat}>
          <MapPinned size={iconSizes.button} color={colors.teal[600]} />
          <AppText variant="headingSm">4</AppText>
          <AppText
            variant="caption"
            color={colors.neutral.textSecondary}
            style={styles.statLabel}
          >
            {t('profile.stats.trips')}
          </AppText>
        </View>
        <Divider orientation="vertical" />
        <View style={styles.stat}>
          <Bell size={iconSizes.button} color={colors.semantic.warning.text} />
          <AppText variant="headingSm">3</AppText>
          <AppText
            variant="caption"
            color={colors.neutral.textSecondary}
            style={styles.statLabel}
          >
            {t('profile.stats.savedAlerts')}
          </AppText>
        </View>
      </AppCard>

      <View>
        <SectionHeader title={t('profile.settingsTitle')} />
        <AppCard style={styles.menuCard}>
          {travelSettings.map((item, index) => (
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

      <View>
        <SectionHeader title={t('profile.accountTitle')} />
        <AppCard style={styles.menuCard}>
          {accountSettings.map((item, index) => (
            <View key={item.key}>
              {index > 0 && <Divider spacing={0} />}
              <ProfileMenuItem
                icon={item.icon}
                label={t(`profile.menu.${item.key}`)}
                onPress={showUnavailableNotice}
              />
            </View>
          ))}
          <Divider spacing={0} />
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

      <View style={styles.privacyNote}>
        <LocateFixed size={iconSizes.inline} color={colors.neutral.iconMuted} />
        <AppText variant="caption" color={colors.neutral.textMuted}>
          {t('profile.menu.locationPrivacy')}
        </AppText>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
    gap: spacing[6],
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  avatar: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.brand[600],
  },
  profileCopy: {
    flex: 1,
    gap: spacing[1],
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[1],
  },
  statLabel: {
    textAlign: 'center',
  },
  menuCard: {
    paddingVertical: spacing[2],
  },
  languageRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[2],
  },
  languageIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.brand[50],
  },
  languageCopy: {
    flex: 1,
    gap: 2,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
});
