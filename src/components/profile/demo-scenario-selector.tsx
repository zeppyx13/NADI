import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppCard, AppText } from '@/components/ui';
import { adaptiveScenarios } from '@/data/adaptive-scenarios';
import { colors, radii, spacing } from '@/constants/theme';
import {
  getActiveDemoScenario,
  hydrateDemoScenario,
  setActiveDemoScenario,
} from '@/storage/demo-scenario-storage';
import type { ItineraryScenarioId } from '@/types/itinerary';

const scenarioIds = Object.keys(adaptiveScenarios) as ItineraryScenarioId[];

/**
 * Development-only control that selects the deterministic scenario the adaptive
 * engine reasons about, so every demo flow can be reproduced on purpose.
 *
 * It renders nothing outside `__DEV__`, so a production build never shows a
 * prototype control to a real user.
 */
export function DemoScenarioSelector() {
  const { t } = useTranslation('screens');
  const [selected, setSelected] = useState<ItineraryScenarioId>(
    getActiveDemoScenario(),
  );

  useEffect(() => {
    let cancelled = false;
    void hydrateDemoScenario().then((scenarioId) => {
      if (!cancelled) setSelected(scenarioId);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!__DEV__) return null;

  const choose = (scenarioId: ItineraryScenarioId) => {
    setSelected(scenarioId);
    void setActiveDemoScenario(scenarioId);
  };

  return (
    <View style={styles.section}>
      <AppText
        variant="labelMd"
        color={colors.neutral.textSecondary}
        style={styles.sectionTitle}
      >
        {t('profile.demoScenarioTitle')}
      </AppText>
      <AppCard variant="outlined" style={styles.card}>
        <AppText variant="caption" color={colors.neutral.textSecondary}>
          {t('profile.demoScenarioDescription')}
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.options}>
            {scenarioIds.map((scenarioId) => {
              const isSelected = scenarioId === selected;
              return (
                <Pressable
                  key={scenarioId}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={t(`profile.demoScenario.${scenarioId}`)}
                  onPress={() => choose(scenarioId)}
                  style={({ pressed }) => [
                    styles.option,
                    isSelected && styles.optionSelected,
                    pressed && styles.optionPressed,
                  ]}
                >
                  <AppText
                    variant="labelMd"
                    color={
                      isSelected ? colors.neutral.white : colors.neutral.textSecondary
                    }
                  >
                    {t(`profile.demoScenario.${scenarioId}`)}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing[2],
  },
  sectionTitle: {
    textTransform: 'uppercase',
  },
  card: {
    gap: spacing[3],
    padding: spacing[4],
  },
  options: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  option: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing[3],
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.neutral.borderSoft,
    backgroundColor: colors.neutral.white,
  },
  optionSelected: {
    borderColor: colors.brand[600],
    backgroundColor: colors.brand[600],
  },
  optionPressed: {
    opacity: 0.72,
  },
});
