import { Check, Globe2, X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText, IconButton } from '@/components/ui';
import { colors, iconSizes, layout, radii, shadows, spacing } from '@/constants/theme';
import { useAppLanguage } from '@/hooks/use-app-language';
import { supportedLanguages, type SupportedLanguage } from '@/i18n/types';

export function LanguageSelector() {
  const { t } = useTranslation('auth');
  const { language, setLanguage } = useAppLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const activeLanguage = supportedLanguages.find((item) => item.code === language);

  const handleSelect = async (nextLanguage: SupportedLanguage) => {
    if (nextLanguage !== language) {
      await setLanguage(nextLanguage);
    }
    setIsOpen(false);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('language.actionLabel')}
        onPress={() => setIsOpen(true)}
        hitSlop={spacing[1]}
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
      >
        <Globe2 size={iconSizes.button} color={colors.brand[700]} />
        <AppText variant="labelLg" color={colors.brand[700]}>
          {(activeLanguage ?? supportedLanguages[1]).shortLabel}
        </AppText>
      </Pressable>

      <Modal
        animationType="fade"
        transparent
        statusBarTranslucent
        visible={isOpen}
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            onPress={() => setIsOpen(false)}
            style={styles.backdrop}
          />
          <SafeAreaView style={styles.sheet} accessibilityViewIsModal>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleGroup}>
                <AppText variant="headingMd">{t('language.title')}</AppText>
                <AppText variant="bodySm" color={colors.neutral.textSecondary}>
                  {t('language.subtitle')}
                </AppText>
              </View>
              <IconButton
                icon={<X size={iconSizes.button} color={colors.neutral.textSecondary} />}
                accessibilityLabel={t('language.close')}
                onPress={() => setIsOpen(false)}
              />
            </View>

            <View style={styles.options}>
              {supportedLanguages.map((item) => {
                const isSelected = item.code === language;
                const label =
                  item.code === 'id' ? t('language.indonesian') : t('language.english');

                return (
                  <Pressable
                    key={item.code}
                    accessibilityRole="radio"
                    accessibilityLabel={label}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => void handleSelect(item.code)}
                    style={({ pressed }) => [
                      styles.option,
                      isSelected && styles.optionSelected,
                      pressed && styles.optionPressed,
                    ]}
                  >
                    <View style={styles.optionCopy}>
                      <AppText variant="labelLg">{label}</AppText>
                      {isSelected && (
                        <AppText variant="caption" color={colors.brand[700]}>
                          {t('language.selected')}
                        </AppText>
                      )}
                    </View>
                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <Check size={iconSizes.badge} color={colors.neutral.white} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minWidth: layout.minTouchTarget,
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing[3],
    borderRadius: radii.pill,
    backgroundColor: colors.neutral.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    ...shadows.sm,
  },
  triggerPressed: {
    opacity: 0.82,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.neutral.navy,
    opacity: 0.48,
  },
  sheet: {
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    paddingBottom: spacing[4],
    ...shadows.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  sheetTitleGroup: {
    flex: 1,
    gap: spacing[1],
  },
  options: {
    marginTop: spacing[5],
    gap: spacing[3],
  },
  option: {
    minHeight: spacing[12] + spacing[2],
    borderWidth: 1,
    borderColor: colors.neutral.borderSoft,
    borderRadius: radii.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  optionSelected: {
    borderColor: colors.brand[300],
    backgroundColor: colors.brand[50],
  },
  optionPressed: {
    opacity: 0.76,
  },
  optionCopy: {
    flex: 1,
    gap: spacing[1],
  },
  checkCircle: {
    width: spacing[6],
    height: spacing[6],
    borderRadius: radii.pill,
    backgroundColor: colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
