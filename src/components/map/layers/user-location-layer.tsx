import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Marker } from 'react-native-maps';

import { colors, radii } from '@/constants/theme';
import type { MapLatLng } from '@/types/map';

export type UserLocationLayerProps = {
  coordinate?: MapLatLng;
  /** True when the coordinate comes from the device instead of the demo start. */
  isDeviceLocation?: boolean;
  visible?: boolean;
};

export const UserLocationLayer = memo(function UserLocationLayer({
  coordinate,
  isDeviceLocation = false,
  visible = true,
}: UserLocationLayerProps) {
  const { t } = useTranslation('screens');

  if (!visible || !coordinate) return null;

  return (
    <Marker
      identifier="nadi-user-location"
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
      zIndex={6}
      accessibilityLabel={
        isDeviceLocation ? t('map.myLocation') : t('map.userMarker')
      }
    >
      <View style={styles.halo}>
        <View style={styles.dot} />
      </View>
    </Marker>
  );
});

const styles = StyleSheet.create({
  halo: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: 'rgba(78, 156, 226, 0.28)',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: radii.pill,
    borderWidth: 3,
    borderColor: colors.neutral.white,
    backgroundColor: colors.brand[600],
  },
});
