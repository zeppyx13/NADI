import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Navigation2 } from 'lucide-react-native';
import type { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppBadge, AppText } from '@/components/ui';
import {
  colors,
  gradients,
  iconSizes,
  layout,
  radii,
  shadows,
  spacing,
} from '@/constants/theme';

import { LanguageSelector } from './language-selector';

type AuthScreenLayoutProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  onBack?: () => void;
}>;

export function AuthScreenLayout({
  title,
  subtitle,
  onBack,
  children,
}: AuthScreenLayoutProps) {
  const { t } = useTranslation(['auth', 'common']);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.outerSafeArea} edges={['left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <LinearGradient colors={gradients.mobility} style={styles.hero}>
              <SafeAreaView edges={['top']} style={styles.heroSafeArea}>
                <View style={styles.toolbar}>
                  {onBack ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('navigation.back', { ns: 'common' })}
                      hitSlop={spacing[1]}
                      onPress={onBack}
                      style={({ pressed }) => [
                        styles.backButton,
                        pressed && styles.headerControlPressed,
                      ]}
                    >
                      <ArrowLeft size={iconSizes.header} color={colors.neutral.white} />
                    </Pressable>
                  ) : (
                    <View style={styles.toolbarSpacer} />
                  )}
                  <LanguageSelector />
                </View>

                <View style={styles.brandBlock}>
                  <View style={styles.brandMark}>
                    <Navigation2 size={iconSizes.header} color={colors.brand[700]} />
                  </View>
                  <View style={styles.brandCopy}>
                    <AppText variant="displayMd" color={colors.neutral.white}>
                      {t('brand.name', { ns: 'auth' })}
                    </AppText>
                    <AppText
                      variant="bodyMd"
                      color={colors.neutral.white}
                      style={styles.tagline}
                    >
                      {t('brand.tagline', { ns: 'auth' })}
                    </AppText>
                  </View>
                </View>
              </SafeAreaView>
            </LinearGradient>

            <View style={styles.cardWrapper}>
              <View style={styles.card}>
                <View style={styles.titleGroup}>
                  <AppText variant="headingLg">{title}</AppText>
                  <AppText variant="bodyMd" color={colors.neutral.textSecondary}>
                    {subtitle}
                  </AppText>
                </View>

                {children}

                <View style={styles.disclosure}>
                  <AppBadge
                    label={t('brand.prototypeLabel', { ns: 'auth' })}
                    variant="simulation"
                    size="sm"
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.brand[700],
  },
  outerSafeArea: {
    flex: 1,
    backgroundColor: colors.neutral.surfaceSoft,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.neutral.surfaceSoft,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing[5],
  },
  hero: {
    borderBottomLeftRadius: radii['2xl'],
    borderBottomRightRadius: radii['2xl'],
    overflow: 'hidden',
  },
  heroSafeArea: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing[10],
  },
  toolbar: {
    minHeight: layout.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[2],
  },
  toolbarSpacer: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
  },
  backButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: radii.pill,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerControlPressed: {
    opacity: 0.72,
  },
  brandBlock: {
    marginTop: spacing[5],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  brandMark: {
    width: spacing[12] + spacing[2],
    height: spacing[12] + spacing[2],
    borderRadius: radii.lg,
    backgroundColor: colors.neutral.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  brandCopy: {
    flex: 1,
    gap: spacing[1],
  },
  tagline: {
    opacity: 0.9,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    marginTop: -spacing[6],
    paddingHorizontal: layout.screenPadding,
  },
  card: {
    borderRadius: radii.xl,
    backgroundColor: colors.neutral.white,
    padding: spacing[5],
    ...shadows.md,
  },
  titleGroup: {
    gap: spacing[2],
    marginBottom: spacing[5],
  },
  disclosure: {
    marginTop: spacing[5],
    alignItems: 'center',
  },
});
