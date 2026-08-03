import * as Linking from 'expo-linking';
import { ExternalLink } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui';
import { colors, iconSizes, layout, spacing } from '@/constants/theme';
import { appendUnsplashUtm } from '@/services/unsplash';
import type { UnsplashPhoto } from '@/types/unsplash';

type PhotoAttributionProps = {
  photo: UnsplashPhoto;
};

export function PhotoAttribution({ photo }: PhotoAttributionProps) {
  const { t } = useTranslation('auth');

  const handlePress = async () => {
    try {
      await Linking.openURL(appendUnsplashUtm(photo.user.links.html));
    } catch {
      // Attribution remains visible if the device cannot open external links.
    }
  };

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={t('hero.photoCreditAccessibility', { name: photo.user.name })}
      hitSlop={spacing[1]}
      onPress={() => void handlePress()}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <AppText variant="caption" color={colors.neutral.white} numberOfLines={2}>
        {t('hero.photoCredit', { name: photo.user.name })}
      </AppText>
      <ExternalLink size={iconSizes.inline} color={colors.neutral.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: layout.minTouchTarget,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  pressed: {
    opacity: 0.68,
  },
});
