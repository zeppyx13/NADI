import { Check, X } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText, IconButton } from '@/components/ui';
import { mapLayerGroups, pendingMapLayers } from '@/constants/map';
import {
  colors,
  iconSizes,
  layout,
  radii,
  shadows,
  spacing,
} from '@/constants/theme';
import type { MapLayerId, MapLayerVisibility } from '@/types/map';

export type MapFilterSheetProps = {
  visible: boolean;
  layerVisibility: MapLayerVisibility;
  onToggleLayer: (layer: MapLayerId) => void;
  onClose: () => void;
};

const pendingLayerSet = new Set<MapLayerId>(pendingMapLayers);

export function MapFilterSheet({
  visible,
  layerVisibility,
  onToggleLayer,
  onClose,
}: MapFilterSheetProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('screens');

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={onClose}
          style={styles.modalBackdrop}
        />
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, spacing[4]) },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <AppText variant="headingSm">{t('map.filterTitle')}</AppText>
              <AppText variant="bodySm" color={colors.neutral.textSecondary}>
                {t('map.filterDescription')}
              </AppText>
            </View>
            <IconButton
              accessibilityLabel={t('common.close')}
              icon={
                <X size={iconSizes.button} color={colors.neutral.textSecondary} />
              }
              onPress={onClose}
            />
          </View>

          <ScrollView style={styles.groups}>
            {mapLayerGroups.map((group) => (
              <View key={group.id} style={styles.group}>
                <AppText variant="micro" color={colors.neutral.textSecondary}>
                  {t(`map.layerGroups.${group.id}`).toLocaleUpperCase()}
                </AppText>
                {group.layers.map((layer) => {
                  const isPending = pendingLayerSet.has(layer);
                  const isSelected = layerVisibility[layer];
                  return (
                    <Pressable
                      key={layer}
                      accessibilityRole="checkbox"
                      accessibilityState={{
                        checked: isSelected,
                        disabled: isPending,
                      }}
                      disabled={isPending}
                      onPress={() => onToggleLayer(layer)}
                      style={({ pressed }) => [
                        styles.option,
                        isSelected && styles.optionSelected,
                        isPending && styles.optionDisabled,
                        pressed && styles.optionPressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.selection,
                          isSelected && styles.selectionSelected,
                        ]}
                      >
                        {isSelected && (
                          <Check
                            size={iconSizes.inline}
                            color={colors.neutral.white}
                          />
                        )}
                      </View>
                      <View style={styles.optionCopy}>
                        <AppText
                          variant="labelLg"
                          color={
                            isSelected
                              ? colors.brand[700]
                              : colors.neutral.textPrimary
                          }
                        >
                          {t(`map.layerOptions.${layer}.label`)}
                        </AppText>
                        <AppText
                          variant="caption"
                          color={colors.neutral.textSecondary}
                        >
                          {isPending
                            ? t('map.layerPending')
                            : t(`map.layerOptions.${layer}.description`)}
                        </AppText>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}

            <AppText
              variant="caption"
              color={colors.neutral.textSecondary}
              style={styles.note}
            >
              {t('map.layerVisibilityNote')}
            </AppText>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    opacity: 0.32,
    backgroundColor: colors.neutral.navy,
  },
  sheet: {
    maxHeight: '82%',
    paddingTop: spacing[2],
    paddingHorizontal: layout.screenPadding,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    backgroundColor: colors.neutral.white,
    ...shadows.lg,
  },
  handle: {
    width: spacing[10],
    height: spacing[1],
    alignSelf: 'center',
    marginBottom: spacing[3],
    borderRadius: radii.pill,
    backgroundColor: colors.neutral.borderStrong,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  headerCopy: {
    flex: 1,
    gap: spacing[1],
  },
  groups: {
    marginTop: spacing[3],
  },
  group: {
    gap: spacing[1],
    marginBottom: spacing[3],
  },
  option: {
    minHeight: layout.minTouchTarget + spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.md,
  },
  optionSelected: {
    backgroundColor: colors.brand[50],
  },
  optionDisabled: {
    opacity: 0.48,
  },
  optionPressed: {
    opacity: 0.72,
  },
  selection: {
    width: iconSizes.button,
    height: iconSizes.button,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.xs,
    borderWidth: 2,
    borderColor: colors.neutral.borderStrong,
  },
  selectionSelected: {
    borderColor: colors.brand[600],
    backgroundColor: colors.brand[600],
  },
  optionCopy: {
    flex: 1,
    gap: spacing[1],
  },
  note: {
    marginBottom: spacing[3],
  },
});
