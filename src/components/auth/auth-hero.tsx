import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui';
import { PhotoAttribution } from '@/components/media/photo-attribution';
import {
  colors,
  gradients,
  iconSizes,
  layout,
  radii,
  shadows,
  spacing,
} from '@/constants/theme';
import { useAuthHeroImage } from '@/hooks/use-auth-hero-image';

import { LanguageSelector } from './language-selector';

type AuthHeroProps = {
  onBack?: () => void;
};

export function AuthHero({ onBack }: AuthHeroProps) {
  const { t } = useTranslation(['auth', 'common']);
  const { photo, imageUrl, fallbackColor } = useAuthHeroImage();
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const shouldRenderImage = !!imageUrl && failedImageUrl !== imageUrl;

  return (
    <LinearGradient
      colors={gradients.mobility}
      style={[styles.hero, { backgroundColor: fallbackColor }]}
    >
      {shouldRenderImage && (
        <Image
          source={{ uri: imageUrl }}
          placeholder={photo?.blur_hash ? { blurhash: photo.blur_hash } : undefined}
          contentFit="cover"
          transition={350}
          cachePolicy="memory-disk"
          accessible={false}
          onError={() => setFailedImageUrl(imageUrl)}
          style={StyleSheet.absoluteFill}
        />
      )}

      <LinearGradient
        colors={gradients.navigationDark}
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.overlay]}
      />

      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <View style={styles.toolbar}>
          {onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('navigation.back', { ns: 'common' })}
              hitSlop={spacing[1]}
              onPress={onBack}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.controlPressed,
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
            <Image
              source={require('@/assets/images/nadi-adaptive-foreground.png')}
              style={styles.brandLogo}
              contentFit="contain"
              accessibilityLabel={t('brand.name', { ns: 'auth' })}
            />
          </View>
          <View style={styles.brandCopy}>
            <AppText variant="displayMd" color={colors.neutral.white}>
              {t('brand.name', { ns: 'auth' })}
            </AppText>
            <AppText variant="bodyMd" color={colors.neutral.white} style={styles.tagline}>
              {t('brand.tagline', { ns: 'auth' })}
            </AppText>
          </View>
        </View>

        <View style={styles.attributionSlot}>
          {photo && shouldRenderImage && (
            <PhotoAttribution
              photo={photo}
              credit={t('hero.photoCredit', {
                ns: 'auth',
                name: photo.user.name,
              })}
              accessibilityLabel={t('hero.photoCreditAccessibility', {
                ns: 'auth',
                name: photo.user.name,
              })}
            />
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: layout.authHeroHeight,
    overflow: 'hidden',
  },
  overlay: {
    opacity: 0.68,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
  },
  toolbar: {
    minHeight: layout.minTouchTarget,
    marginTop: spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toolbarSpacer: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
  },
  backButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: radii.pill,
    backgroundColor: colors.brand[800],
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlPressed: {
    opacity: 0.7,
  },
  brandBlock: {
    flex: 1,
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
  brandLogo: {
    width: '78%',
    height: '78%',
  },
  brandCopy: {
    flex: 1,
    gap: spacing[1],
  },
  tagline: {
    opacity: 0.92,
  },
  attributionSlot: {
    minHeight: layout.minTouchTarget,
  },
});
