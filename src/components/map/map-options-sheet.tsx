import { Check, X } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText, IconButton } from '@/components/ui';
import {
  colors,
  iconSizes,
  layout,
  radii,
  shadows,
  spacing,
} from '@/constants/theme';

export type MapOptionItem = {
  id: string;
  label: string;
  description?: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export type MapOptionsSheetProps = {
  visible: boolean;
  title: string;
  description: string;
  selectionMode: 'single' | 'multiple';
  options: readonly MapOptionItem[];
  onClose: () => void;
};

export function MapOptionsSheet({
  visible,
  title,
  description,
  selectionMode,
  options,
  onClose,
}: MapOptionsSheetProps) {
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
              <AppText variant="headingSm">{title}</AppText>
              <AppText variant="bodySm" color={colors.neutral.textSecondary}>
                {description}
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

          <View
            accessibilityRole={selectionMode === 'single' ? 'radiogroup' : undefined}
            style={styles.options}
          >
            {options.map((option) => (
              <Pressable
                key={option.id}
                accessibilityRole={
                  selectionMode === 'single' ? 'radio' : 'checkbox'
                }
                accessibilityState={{
                  selected: option.selected,
                  checked: option.selected,
                  disabled: option.disabled,
                }}
                disabled={option.disabled}
                onPress={option.onPress}
                style={({ pressed }) => [
                  styles.option,
                  option.selected && styles.optionSelected,
                  option.disabled && styles.optionDisabled,
                  pressed && styles.optionPressed,
                ]}
              >
                <View
                  style={[
                    styles.selection,
                    selectionMode === 'single' && styles.selectionRadio,
                    option.selected && styles.selectionSelected,
                  ]}
                >
                  {option.selected && (
                    <Check size={iconSizes.inline} color={colors.neutral.white} />
                  )}
                </View>
                <View style={styles.optionCopy}>
                  <AppText
                    variant="labelLg"
                    color={
                      option.selected
                        ? colors.brand[700]
                        : colors.neutral.textPrimary
                    }
                  >
                    {option.label}
                  </AppText>
                  {option.description && (
                    <AppText variant="caption" color={colors.neutral.textSecondary}>
                      {option.description}
                    </AppText>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
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
  options: {
    gap: spacing[1],
    marginTop: spacing[3],
  },
  option: {
    minHeight: 56,
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
  selectionRadio: {
    borderRadius: radii.pill,
  },
  selectionSelected: {
    borderColor: colors.brand[600],
    backgroundColor: colors.brand[600],
  },
  optionCopy: {
    flex: 1,
    gap: spacing[1],
  },
});
