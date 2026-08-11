const placeholderRecording: number = require('@/assets/videos/dummyATCS.mp4');

const monitoringRecordings: Record<string, number> = {
  'atcs-dewa-ruci-evening': require('@/assets/videos/atcs-dewa-ruci-evening.mp4'),
  'cctv-teuku-umar-evening': require('@/assets/videos/cctv-teuku-umar-evening.mp4'),
  'cctv-besakih-evening': require('@/assets/videos/cctv-besakih-evening.mp4'),
  'atcs-titi-banda-evening': placeholderRecording,
  'atcs-simpang-ubud-evening': placeholderRecording,
  'atcs-simpang-sanur-evening': placeholderRecording,
  'atcs-gatsu-timur-evening': placeholderRecording,
  'atcs-simpang-nusa-dua-evening': placeholderRecording,
  'cctv-pantai-kuta-evening': placeholderRecording,
  'cctv-berawa-canggu-evening': placeholderRecording,
  'cctv-tanah-lot-evening': placeholderRecording,
};

export type MonitoringMediaSource =
  | { kind: 'asset'; module: number }
  | { kind: 'uri'; uri: string };

export function resolveMonitoringMedia(media?: {
  assetId?: string;
  uri?: string;
}): MonitoringMediaSource | null {
  if (!media) return null;

  if (media.assetId) {
    const registered = monitoringRecordings[media.assetId];
    if (registered !== undefined) {
      return { kind: 'asset', module: registered };
    }
  }

  if (media.uri) {
    return { kind: 'uri', uri: media.uri };
  }

  return null;
}
