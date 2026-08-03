import { useRouter } from 'expo-router';
import { Navigation2 } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppButton, AppText } from '@/components/ui';
import { colors, iconSizes, layout, radii, spacing } from '@/constants/theme';

export default function HomeScreen() {
  const { t } = useTranslation('common');
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.brandMark}>
          <Navigation2 size={iconSizes.empty} color={colors.neutral.white} />
        </View>
        <View style={styles.copy}>
          <AppText variant="headingLg" style={styles.centerText}>
            {t('home.title')}
          </AppText>
          <AppText
            variant="bodyMd"
            color={colors.neutral.textSecondary}
            style={styles.centerText}
          >
            {t('home.subtitle')}
          </AppText>
        </View>
        <AppButton
          label={t('home.logout')}
          variant="ghost"
          onPress={() => router.replace('/login')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.surfaceSoft,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    gap: spacing[6],
  },
  brandMark: {
    width: spacing[12] * 2,
    height: spacing[12] * 2,
    borderRadius: radii.xl,
    backgroundColor: colors.brand[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  copy: {
    alignItems: 'center',
    gap: spacing[2],
  },
  centerText: {
    textAlign: 'center',
  },
});
