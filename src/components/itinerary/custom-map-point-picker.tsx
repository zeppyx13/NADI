import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  type MapProps,
  type StyleSpecification,
} from '@maplibre/maplibre-react-native';
import { X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Modal, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppButton, AppInput, AppText, IconButton } from '@/components/ui';
import {
  baliMapCenter,
  baliMapZoom,
  mapConfig,
  mapFallbackStyle,
} from '@/constants/map';
import {
  colors,
  iconSizes,
  layout,
  radii,
  shadows,
  spacing,
} from '@/constants/theme';
import type { ItineraryPlace } from '@/types/itinerary';
import { isMapLibreNativeAvailable } from '@/utils/maplibre-polyfill';
import { CustomMapPointPicker as CustomMapPointPickerFallback } from './custom-map-point-picker.web';

type Coordinate = Pick<ItineraryPlace, 'latitude' | 'longitude'>;
type MapPressHandler = NonNullable<MapProps['onPress']>;

export type CustomMapPointPickerProps = {
  visible: boolean;
  title?: string;
  onClose: () => void;
  onConfirm: (place: ItineraryPlace) => void;
};

export function CustomMapPointPicker(props: CustomMapPointPickerProps) {
  if (!isMapLibreNativeAvailable()) {
    return <CustomMapPointPickerFallback {...props} />;
  }
  return <NativeCustomMapPointPicker {...props} />;
}

function NativeCustomMapPointPicker({
  visible,
  title,
  onClose,
  onConfirm,
}: CustomMapPointPickerProps) {
  const { t } = useTranslation('itinerary');
  const insets = useSafeAreaInsets();
  const [coordinate, setCoordinate] = useState<Coordinate | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeMapStyle, setActiveMapStyle] = useState<
    string | StyleSpecification
  >(mapConfig.style);
  const [bottomSheetHeight, setBottomSheetHeight] = useState(0);
  const mapBottomInset =
    bottomSheetHeight + insets.bottom + spacing[3] + spacing[2];

  const initialize = () => {
    setCoordinate(null);
    setName('');
    setError(null);
    setActiveMapStyle(mapConfig.style);
  };

  const selectedPoint = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point>>(
    () => ({
      type: 'FeatureCollection',
      features: coordinate
        ? [
            {
              type: 'Feature',
              id: 'selected-custom-point',
              geometry: {
                type: 'Point',
                coordinates: [coordinate.longitude, coordinate.latitude],
              },
              properties: {},
            },
          ]
        : [],
    }),
    [coordinate],
  );

  const selectCoordinate: MapPressHandler = (event) => {
    const [longitude, latitude] = event.nativeEvent.lngLat;
    setCoordinate({ latitude, longitude });
    setError(null);
  };

  const handleMapLoadFailure = () => {
    if (activeMapStyle === mapFallbackStyle) return;
    setActiveMapStyle(mapFallbackStyle);
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
        <Map
          style={StyleSheet.absoluteFill}
          mapStyle={activeMapStyle}
          compass={false}
          scaleBar={false}
          touchPitch={false}
          touchRotate={false}
          contentInset={{
            top: 0,
            right: 0,
            bottom: mapBottomInset,
            left: 0,
          }}
          attributionPosition={{
            left: spacing[2],
            bottom: mapBottomInset + spacing[1],
          }}
          logoPosition={{
            left: spacing[2],
            bottom: mapBottomInset + spacing[8],
          }}
          accessibilityLabel={t('customPoint.mapAccessibility')}
          onPress={selectCoordinate}
          onLongPress={selectCoordinate}
          onDidFailLoadingMap={handleMapLoadFailure}
        >
          <Camera
            initialViewState={{
              center: [...baliMapCenter],
              zoom: baliMapZoom,
            }}
          />
          {coordinate && (
            <GeoJSONSource id="custom-point-source" data={selectedPoint}>
              <Layer
                id="custom-point-halo"
                type="circle"
                paint={{
                  'circle-color': colors.neutral.white,
                  'circle-opacity': 0.95,
                  'circle-radius': 14,
                }}
              />
              <Layer
                id="custom-point-marker"
                type="circle"
                paint={{
                  'circle-color': colors.teal[600],
                  'circle-radius': 9,
                  'circle-stroke-color': colors.neutral.white,
                  'circle-stroke-width': 3,
                }}
              />
            </GeoJSONSource>
          )}
        </Map>

        <SafeAreaView pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <AppText variant="headingSm">{title ?? t('customPoint.title')}</AppText>
              <AppText variant="caption" color={colors.neutral.textSecondary}>
                {t('customPoint.instruction')}
              </AppText>
            </View>
            <IconButton
              accessibilityLabel={t('common.cancel')}
              icon={<X size={iconSizes.button} color={colors.neutral.textPrimary} />}
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
                {coordinate.latitude.toFixed(5)}, {coordinate.longitude.toFixed(5)}
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
