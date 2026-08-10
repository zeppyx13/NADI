import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { CalendarDays, Clock3 } from 'lucide-react-native';
import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppButton, AppText } from '@/components/ui';
import {
  colors,
  iconSizes,
  layout,
  radii,
  shadows,
  spacing,
} from '@/constants/theme';

export type NativeDateTimeFieldProps = {
  label: string;
  value: Date;
  mode: 'date' | 'time';
  onChange: (value: Date) => void;
  minimumDate?: Date;
  accessibilityLabel?: string;
};

function formatValue(value: Date, mode: 'date' | 'time', language: string) {
  if (mode === 'time') {
    return new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(value);
  }

  return new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(value);
}

export function NativeDateTimeField({
  label,
  value,
  mode,
  onChange,
  minimumDate,
  accessibilityLabel,
}: NativeDateTimeFieldProps) {
  const { t, i18n } = useTranslation('itinerary');
  const [isOpen, setIsOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const Icon = mode === 'date' ? CalendarDays : Clock3;

  const openPicker = () => {
    setDraftValue(value);
    setIsOpen(true);
  };

  const commitAndroidValue = (nextValue: Date) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <View style={styles.fieldGroup}>
      <AppText variant="labelMd">{label}</AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityValue={{ text: formatValue(value, mode, i18n.language) }}
        onPress={openPicker}
        style={({ pressed }) => [styles.field, pressed && styles.pressed]}
      >
        <Icon size={iconSizes.button} color={colors.brand[600]} />
        <AppText variant="bodyLg" style={styles.value}>
          {formatValue(value, mode, i18n.language)}
        </AppText>
      </Pressable>

      {Platform.OS === 'android' && isOpen && (
        <DateTimePicker
          value={value}
          mode={mode}
          display="default"
          presentation="dialog"
          is24Hour
          minimumDate={minimumDate}
          accentColor={colors.brand[600]}
          positiveButton={{ label: t('common.done') }}
          negativeButton={{ label: t('common.cancel') }}
          onValueChange={(_, nextValue) => commitAndroidValue(nextValue)}
          onDismiss={() => setIsOpen(false)}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal
          animationType="slide"
          presentationStyle="pageSheet"
          visible={isOpen}
          onRequestClose={() => setIsOpen(false)}
        >
          <SafeAreaView style={styles.modalSafeArea} edges={['top', 'bottom']}>
            <View style={styles.modalHeader}>
              <AppButton
                variant="ghost"
                label={t('common.cancel')}
                onPress={() => setIsOpen(false)}
              />
              <AppText variant="headingSm">{label}</AppText>
              <AppButton
                variant="ghost"
                label={t('common.done')}
                onPress={() => {
                  onChange(draftValue);
                  setIsOpen(false);
                }}
              />
            </View>
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={draftValue}
                mode={mode}
                display={mode === 'date' ? 'inline' : 'spinner'}
                minimumDate={minimumDate}
                locale={i18n.language === 'id' ? 'id_ID' : 'en_US'}
                accentColor={colors.brand[600]}
                themeVariant="light"
                onValueChange={(_, nextValue) => setDraftValue(nextValue)}
                style={styles.picker}
              />
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldGroup: {
    gap: spacing[1],
  },
  field: {
    minHeight: layout.inputHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    borderWidth: 1,
    borderColor: colors.neutral.borderSoft,
    borderRadius: radii.md,
    backgroundColor: colors.neutral.white,
  },
  pressed: {
    backgroundColor: colors.brand[50],
  },
  value: {
    flex: 1,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: colors.neutral.surfaceSoft,
  },
  modalHeader: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
    paddingHorizontal: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.borderSoft,
    backgroundColor: colors.neutral.white,
    ...shadows.sm,
  },
  pickerContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing[4],
  },
  picker: {
    minHeight: 340,
  },
});
