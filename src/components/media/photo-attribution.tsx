import * as Linking from 'expo-linking';
import { ExternalLink } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, iconSizes, layout, spacing } from '@/constants/theme';
import { appendUnsplashUtm } from '@/services/unsplash';
import type { UnsplashPhoto } from '@/types/unsplash';

export type PhotoAttributionProps = {
  photo: UnsplashPhoto;
  credit: string;
  accessibilityLabel: string;
  tone?: 'light' | 'surface';
  compact?: boolean;
};

export function PhotoAttribution({
  photo,
  credit,
  accessibilityLabel,
  tone = 'light',
  compact = false,
}: PhotoAttributionProps) {
  const foreground =
    tone === 'light' ? colors.neutral.white : colors.neutral.textSecondary;

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
      accessibilityLabel={accessibilityLabel}
      hitSlop={spacing[1]}
      onPress={() => void handlePress()}
      style={({ pressed }) => [
        styles.container,
        compact && styles.compact,
        pressed && styles.pressed,
      ]}
    >
      <AppText
        variant="caption"
        color={foreground}
        numberOfLines={compact ? 1 : 2}
        style={styles.credit}
      >
        {credit}
      </AppText>
      <ExternalLink size={iconSizes.inline} color={foreground} />
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
  compact: {
    maxWidth: '100%',
  },
  credit: {
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.68,
  },
});
