import { MapPin, Sparkles } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, SearchField } from '@/components/ui';
import {
  colors,
  iconSizes,
  radii,
  shadows,
  spacing,
} from '@/constants/theme';
import type { MapPlaceResult, MapPlaceSearchStatus } from '@/types/map';

export type MapSearchBarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onClear: () => void;
  catalogResults: readonly MapPlaceResult[];
  googleResults: readonly MapPlaceResult[];
  status: MapPlaceSearchStatus;
  isExpanded: boolean;
  onExpand: () => void;
  onSelect: (result: MapPlaceResult) => void;
};

const maxPanelHeight = 288;

export function MapSearchBar({
  query,
  onQueryChange,
  onClear,
  catalogResults,
  googleResults,
  status,
  isExpanded,
  onExpand,
  onSelect,
}: MapSearchBarProps) {
  const { t } = useTranslation('screens');
  const hasResults = catalogResults.length > 0 || googleResults.length > 0;
  const showPanel = isExpanded && query.trim().length > 0;

  const renderResult = (result: MapPlaceResult) => (
    <Pressable
      key={result.id}
      accessibilityRole="button"
      accessibilityLabel={result.name}
      onPress={() => onSelect(result)}
      style={({ pressed }) => [styles.result, pressed && styles.resultPressed]}
    >
      {result.source === 'nadi-destination' ? (
        <Sparkles size={iconSizes.button} color={colors.brand[600]} />
      ) : (
        <MapPin size={iconSizes.button} color={colors.neutral.iconMuted} />
      )}
      <View style={styles.resultCopy}>
        <AppText variant="labelLg" numberOfLines={1}>
          {result.name}
        </AppText>
        {result.address && (
          <AppText
            variant="caption"
            color={colors.neutral.textSecondary}
            numberOfLines={1}
          >
            {result.address}
          </AppText>
        )}
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <SearchField
          value={query}
          placeholder={t('map.searchPlaceholder')}
          accessibilityLabel={t('map.searchAccessibility')}
          clearAccessibilityLabel={t('map.searchClear')}
          autoCorrect={false}
          returnKeyType="search"
          onChangeText={onQueryChange}
          onFocus={onExpand}
          onClear={onClear}
        />
      </View>

      {showPanel && (
        <View style={styles.panel}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={styles.panelScroll}
          >
            {catalogResults.length > 0 && (
              <View style={styles.section}>
                <AppText variant="micro" color={colors.neutral.textSecondary}>
                  {t('map.searchNadiSection')}
                </AppText>
                {catalogResults.map(renderResult)}
              </View>
            )}

            {googleResults.length > 0 && (
              <View style={styles.section}>
                <AppText variant="micro" color={colors.neutral.textSecondary}>
                  {t('map.searchGoogleSection')}
                </AppText>
                {googleResults.map(renderResult)}
              </View>
            )}

            {!hasResults && (
              <AppText
                variant="bodySm"
                color={colors.neutral.textSecondary}
                style={styles.stateCopy}
              >
                {status === 'searching'
                  ? t('map.searchLoading')
                  : status === 'unavailable'
                    ? t('map.searchGoogleDisabled')
                    : status === 'error'
                      ? t('map.searchError')
                      : t('map.searchEmpty')}
              </AppText>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  field: {
    ...shadows.md,
    borderRadius: radii.md,
    backgroundColor: colors.neutral.white,
  },
  panel: {
    marginTop: spacing[2],
    overflow: 'hidden',
    borderRadius: radii.lg,
    backgroundColor: colors.neutral.white,
    ...shadows.lg,
  },
  panelScroll: {
    maxHeight: maxPanelHeight,
  },
  section: {
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  result: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    borderRadius: radii.sm,
  },
  resultPressed: {
    backgroundColor: colors.brand[50],
  },
  resultCopy: {
    flex: 1,
    gap: spacing[1],
  },
  stateCopy: {
    padding: spacing[4],
  },
});
