import { useVideoPlayer, VideoView, type VideoSource } from 'expo-video';
import { X } from 'lucide-react-native';
import { Modal, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText, IconButton } from '@/components/ui';
import {
  colors,
  iconSizes,
  layout,
  radii,
  spacing,
} from '@/constants/theme';
import { resolveMonitoringMedia } from '@/data/monitoring-media';
import type { MonitoringPoint } from '@/types/map-intelligence';

export type MonitoringPlaybackModalProps = {
  visible: boolean;
  point?: MonitoringPoint;
  onClose: () => void;
};

/**
 * Plays the recorded monitoring clip for a point. This is recorded footage; the
 * copy never describes it as a live stream.
 */
export function MonitoringPlaybackModal({
  visible,
  point,
  onClose,
}: MonitoringPlaybackModalProps) {
  const { t, i18n } = useTranslation('screens');
  const media = resolveMonitoringMedia(point?.recordedMedia);
  const source: VideoSource =
    media === null ? null : media.kind === 'asset' ? media.module : media.uri;

  const player = useVideoPlayer(source, (instance) => {
    instance.loop = true;
  });

  const recordedAt = point?.recordedMedia?.recordedAt;
  const formattedRecordedAt = recordedAt
    ? new Intl.DateTimeFormat(i18n.language === 'id' ? 'id-ID' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(recordedAt))
    : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.copy}>
            <AppText variant="headingSm" color={colors.neutral.white}>
              {point?.name ?? t('map.monitoringPlaybackTitle')}
            </AppText>
            {point && (
              <AppText variant="caption" color={colors.neutral.borderStrong}>
                {t(`map.monitoringType.${point.type}`)} · {point.area}
              </AppText>
            )}
          </View>
          <IconButton
            accessibilityLabel={t('common.close')}
            icon={<X size={iconSizes.button} color={colors.neutral.white} />}
            onPress={onClose}
          />
        </View>

        <View style={styles.stage}>
          {source === null ? (
            <View style={styles.unavailable}>
              <AppText
                variant="headingSm"
                color={colors.neutral.white}
                style={styles.centered}
              >
                {t('map.monitoringRecordingUnavailableTitle')}
              </AppText>
              <AppText
                variant="bodySm"
                color={colors.neutral.borderStrong}
                style={styles.centered}
              >
                {t('map.monitoringRecordingUnavailable')}
              </AppText>
            </View>
          ) : (
            <VideoView
              player={player}
              style={styles.video}
              contentFit="contain"
              nativeControls
              accessibilityLabel={t('map.monitoringPlaybackAccessibility')}
            />
          )}
        </View>

        <View style={styles.footer}>
          <AppText variant="caption" color={colors.neutral.borderStrong}>
            {formattedRecordedAt
              ? t('map.monitoringRecordedAt', { time: formattedRecordedAt })
              : t('map.monitoringRecordedNote')}
          </AppText>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing[3],
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: layout.screenPadding,
    overflow: 'hidden',
    borderRadius: radii.lg,
    backgroundColor: colors.neutral.navy,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  unavailable: {
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[6],
  },
  centered: {
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing[3],
  },
});
