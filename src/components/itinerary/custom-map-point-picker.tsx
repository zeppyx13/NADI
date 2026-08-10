import { MapPin, X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import MapView, {
  Marker,
  type LongPressEvent,
  type MapPressEvent,
} from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppButton, AppInput, AppText, IconButton } from '@/components/ui';
import {
  colors,
  iconSizes,
  layout,
  radii,
  shadows,
  spacing,
} from '@/constants/theme';
import type { ItineraryPlace } from '@/types/itinerary';

type Coordinate = Pick<ItineraryPlace, 'latitude' | 'longitude'>;

export type CustomMapPointPickerProps = {
  visible: boolean;
  title?: string;
  onClose: () => void;
  onConfirm: (place: ItineraryPlace) => void;
};

const baliRegion = {
  latitude: -8.4095,
  longitude: 115.1889,
  latitudeDelta: 1.25,
  longitudeDelta: 1.05,
};

export function CustomMapPointPicker({
  visible,
  title,
  onClose,
  onConfirm,
}: CustomMapPointPickerProps) {
  const { t } = useTranslation('itinerary');
  const [coordinate, setCoordinate] = useState<Coordinate | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const initialize = () => {
    setCoordinate(null);
    setName('');
    setError(null);
  };

  const selectCoordinate = (event: MapPressEvent | LongPressEvent) => {
    setCoordinate(event.nativeEvent.coordinate);
    setError(null);
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
          style={StyleSheet.absoluteFill}
          initialRegion={baliRegion}
          showsCompass={false}
          showsMyLocationButton={false}
          toolbarEnabled={false}
          accessibilityLabel={t('customPoint.mapAccessibility')}
          onPress={selectCoordinate}
          onLongPress={selectCoordinate}
        >
          {coordinate && (
            <Marker coordinate={coordinate} title={name || t('customPoint.defaultName')}>
              <View style={styles.marker}>
                <MapPin size={iconSizes.button} color={colors.neutral.white} />
              </View>
            </Marker>
          )}
        </MapView>

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

          <View style={styles.bottomSheet}>
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
  marker: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.neutral.white,
    borderRadius: radii.pill,
    backgroundColor: colors.teal[600],
    ...shadows.md,
  },
});
