import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  type LongPressEvent,
  type MapPressEvent,
} from 'react-native-maps';

import { AppButton, AppInput, AppText, IconButton } from '@/components/ui';
import { baliRegion, cleanMapStyle } from '@/constants/map';
import {
  colors,
  iconSizes,
  layout,
  radii,
  shadows,
  spacing,
} from '@/constants/theme';
import type { ItineraryPlace } from '@/types/itinerary';
import type { MapLatLng } from '@/types/map';

/**
 * The `pick-location` surface of the NADI map: tap or long-press to place a
 * point, name it, then confirm back to the caller.
 */
export type CustomMapPointPickerProps = {
  visible: boolean;
  title?: string;
  onClose: () => void;
  onConfirm: (place: ItineraryPlace) => void;
};

export function CustomMapPointPicker({
  visible,
  title,
  onClose,
  onConfirm,
}: CustomMapPointPickerProps) {
  const { t } = useTranslation('itinerary');
  const insets = useSafeAreaInsets();
  const [coordinate, setCoordinate] = useState<MapLatLng | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [bottomSheetHeight, setBottomSheetHeight] = useState(0);
  const mapBottomInset =
    bottomSheetHeight + insets.bottom + spacing[3] + spacing[2];

  const initialize = () => {
    setCoordinate(null);
    setName('');
    setError(null);
  };

  const selectCoordinate = (event: MapPressEvent | LongPressEvent) => {
    setCoordinate(event.nativeEvent.coordinate);
    setError(null);
  };

  const handleBottomSheetLayout = (event: LayoutChangeEvent) => {
    const nextHeight = Math.ceil(event.nativeEvent.layout.height);
    setBottomSheetHeight((current) =>
      current === nextHeight ? current : nextHeight,
    );
  };

  const confirm = () => {
    if (!coordinate) {
      setError(t('customPoint.selectFirst'));
      return;
    }

    onConfirm({
      id: `custom-map-${coordinate.latitude.toFixed(5)}-${coordinate.longitude.toFixed(5)}`,
      name: name.trim() || t('customPoint.defaultName'),
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      source: 'custom-map-point',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onShow={initialize}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFill}
          initialRegion={baliRegion}
          customMapStyle={[...cleanMapStyle]}
          mapPadding={{ top: 0, right: 0, bottom: mapBottomInset, left: 0 }}
          showsCompass={false}
          showsMyLocationButton={false}
          toolbarEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
          accessibilityLabel={t('customPoint.mapAccessibility')}
          onPress={selectCoordinate}
          onLongPress={selectCoordinate}
        >
          {coordinate && (
            <Marker
              identifier="custom-map-point"
              coordinate={coordinate}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
              accessibilityLabel={t('customPoint.selectedMarker')}
            >
              <View style={styles.pinHalo}>
                <View style={styles.pin} />
              </View>
            </Marker>
          )}
        </MapView>

        <SafeAreaView pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <AppText variant="headingSm">
                {title ?? t('customPoint.title')}
              </AppText>
              <AppText variant="caption" color={colors.neutral.textSecondary}>
                {t('customPoint.instruction')}
              </AppText>
            </View>
            <IconButton
              accessibilityLabel={t('common.cancel')}
              icon={
                <X size={iconSizes.button} color={colors.neutral.textPrimary} />
              }
              onPress={onClose}
            />
          </View>

          <View style={styles.bottomSheet} onLayout={handleBottomSheetLayout}>
            <AppInput
              label={t('customPoint.nameLabel')}
              placeholder={t('customPoint.namePlaceholder')}
              value={name}
              onChangeText={setName}
            />
            {coordinate && (
              <AppText variant="caption" color={colors.neutral.textSecondary}>
                {coordinate.latitude.toFixed(5)},{' '}
                {coordinate.longitude.toFixed(5)}
              </AppText>
            )}
            {error && (
              <AppText variant="bodySm" color={colors.semantic.danger.text}>
                {error}
              </AppText>
            )}
            <AppButton
              fullWidth
              disabled={!coordinate}
              label={t('customPoint.add')}
              onPress={confirm}
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand[50],
  },
  pinHalo: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  pin: {
    width: 18,
    height: 18,
    borderRadius: radii.pill,
    borderWidth: 3,
    borderColor: colors.neutral.white,
    backgroundColor: colors.teal[600],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: layout.screenPadding,
    marginTop: spacing[2],
    padding: spacing[3],
    borderRadius: radii.lg,
    backgroundColor: colors.neutral.white,
    ...shadows.md,
  },
  headerCopy: {
    flex: 1,
    gap: spacing[1],
  },
  bottomSheet: {
    position: 'absolute',
    right: layout.screenPadding,
    bottom: spacing[3],
    left: layout.screenPadding,
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radii.xl,
    backgroundColor: colors.neutral.white,
    ...shadows.lg,
  },
});
