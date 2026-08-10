import { MapPin, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
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
import type { CustomMapPointPickerProps } from './custom-map-point-picker';

type Point = {
  x: number;
  y: number;
  latitude: number;
  longitude: number;
};

export function CustomMapPointPicker({
  visible,
  title,
  onClose,
  onConfirm,
}: CustomMapPointPickerProps) {
  const { t } = useTranslation('itinerary');
  const [point, setPoint] = useState<Point | null>(null);
  const [name, setName] = useState('');
  const [mapSize, setMapSize] = useState({ width: 1, height: 1 });

  const initialize = () => {
    setPoint(null);
    setName('');
  };

  const selectPoint = (event: GestureResponderEvent) => {
    const x = Math.max(0, Math.min(mapSize.width, event.nativeEvent.locationX));
    const y = Math.max(0, Math.min(mapSize.height, event.nativeEvent.locationY));
    setPoint({
      x,
      y,
      latitude: -7.9 - (y / mapSize.height) * 1.05,
      longitude: 114.75 + (x / mapSize.width) * 1.05,
    });
  };

  const updateMapSize = (event: LayoutChangeEvent) => {
    setMapSize(event.nativeEvent.layout);
  };

  const confirm = () => {
    if (!point) return;
    const place: ItineraryPlace = {
      id: `custom-map-${point.latitude.toFixed(5)}-${point.longitude.toFixed(5)}`,
      name: name.trim() || t('customPoint.defaultName'),
      latitude: point.latitude,
      longitude: point.longitude,
      source: 'custom-map-point',
    };
    onConfirm(place);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onShow={initialize}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
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

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('customPoint.mapAccessibility')}
          onLayout={updateMapSize}
          onPress={selectPoint}
          style={styles.mapPreview}
        >
          <View style={styles.island} />
          {point && (
            <View
              pointerEvents="none"
              style={[styles.marker, { left: point.x - 21, top: point.y - 42 }]}
            >
              <MapPin size={iconSizes.button} color={colors.neutral.white} />
            </View>
          )}
        </Pressable>

        <View style={styles.bottomSheet}>
          <AppInput
            label={t('customPoint.nameLabel')}
            placeholder={t('customPoint.namePlaceholder')}
            value={name}
            onChangeText={setName}
          />
          {point && (
            <AppText variant="caption" color={colors.neutral.textSecondary}>
              {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}
            </AppText>
          )}
          <AppButton
            fullWidth
            disabled={!point}
            label={t('customPoint.add')}
            onPress={confirm}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.brand[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.borderSoft,
    backgroundColor: colors.neutral.white,
  },
  headerCopy: {
    flex: 1,
    gap: spacing[1],
  },
  mapPreview: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.brand[100],
  },
  island: {
    position: 'absolute',
    top: '20%',
    right: '10%',
    bottom: '20%',
    left: '10%',
    borderWidth: 28,
    borderColor: colors.teal[100],
    borderRadius: radii['2xl'],
    backgroundColor: colors.neutral.surfaceSoft,
    transform: [{ rotate: '-10deg' }],
  },
  marker: {
    position: 'absolute',
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.teal[600],
    ...shadows.md,
  },
  bottomSheet: {
    gap: spacing[3],
    padding: layout.screenPadding,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.borderSoft,
    backgroundColor: colors.neutral.white,
    ...shadows.lg,
  },
});
