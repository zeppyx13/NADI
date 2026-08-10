import {
  Check,
  House,
  Landmark,
  MapPin,
  MapPinned,
  Sparkles,
  Trees,
  UtensilsCrossed,
  Waves,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { SelectionChip } from '@/components/itinerary/selection-chip';
import {
  AppButton,
  AppText,
  EmptyState,
  IconButton,
  SearchField,
} from '@/components/ui';
import {
  colors,
  iconSizes,
  layout,
  radii,
  shadows,
  spacing,
} from '@/constants/theme';
import { destinationCategories, destinations } from '@/data/destinations';
import {
  readRecentDestinationIds,
  recordRecentDestinationIds,
} from '@/storage/recent-destination-storage';
import type { Destination, DestinationCategory } from '@/types/destination';

type DestinationPickerMode = 'single' | 'multiple';
type CategoryFilter = 'all' | DestinationCategory;

type DestinationSection = {
  title: string;
  data: Destination[];
};

const categoryIcons: Record<DestinationCategory, LucideIcon> = {
  beach: Waves,
  culture: Landmark,
  nature: Trees,
  spiritual: Sparkles,
  culinary: UtensilsCrossed,
  village: House,
};

export type DestinationPickerProps = {
  visible: boolean;
  title?: string;
  mode?: DestinationPickerMode;
  selectedIds: readonly string[];
  maxSelections?: number;
  allowCustomPoint?: boolean;
  onClose: () => void;
  onConfirm: (selected: Destination[]) => void;
  onChooseCustomPoint?: () => void;
};

export function DestinationPicker({
  visible,
  title,
  mode = 'multiple',
  selectedIds,
  maxSelections,
  allowCustomPoint = false,
  onClose,
  onConfirm,
  onChooseCustomPoint,
}: DestinationPickerProps) {
  const { t } = useTranslation('itinerary');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [draftIds, setDraftIds] = useState<string[]>([...selectedIds]);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  const matchingDestinations = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return destinations.filter((destination) => {
      const matchesCategory =
        category === 'all' || destination.category === category;
      const searchable = [
        destination.name,
        destination.region,
        destination.regency,
        destination.category,
        ...destination.tags,
      ]
        .join(' ')
        .toLocaleLowerCase();
      return (
        matchesCategory &&
        (normalizedQuery.length === 0 || searchable.includes(normalizedQuery))
      );
    });
  }, [category, query]);

  const sections = useMemo<DestinationSection[]>(() => {
    if (query.trim() || category !== 'all') {
      return [{ title: t('picker.all'), data: matchingDestinations }];
    }

    const recent = recentIds.flatMap((id) => {
      const destination = destinations.find((item) => item.id === id);
      return destination ? [destination] : [];
    });
    const recentSet = new Set(recent.map((destination) => destination.id));
    const recommended = destinations.filter(
      (destination) =>
        destination.intelligenceCoverage === 'pilot' &&
        !recentSet.has(destination.id),
    );
    const featuredSet = new Set([
      ...recentSet,
      ...recommended.map((destination) => destination.id),
    ]);
    const all = destinations.filter(
      (destination) => !featuredSet.has(destination.id),
    );

    return [
      ...(recent.length > 0 ? [{ title: t('picker.recent'), data: recent }] : []),
      { title: t('picker.recommended'), data: recommended },
      { title: t('picker.all'), data: all },
    ].filter((section) => section.data.length > 0);
  }, [category, matchingDestinations, query, recentIds, t]);

  const initialize = () => {
    setDraftIds([...selectedIds]);
    setQuery('');
    setCategory('all');
    void readRecentDestinationIds().then(setRecentIds);
  };

  const toggleDestination = (destinationId: string) => {
    setDraftIds((current) => {
      if (mode === 'single') return [destinationId];
      if (
        maxSelections &&
        current.length >= maxSelections &&
        !current.includes(destinationId)
      ) {
        return current;
      }
      return current.includes(destinationId)
        ? current.filter((id) => id !== destinationId)
        : [...current, destinationId];
    });
  };

  const confirm = () => {
    const selected = draftIds.flatMap((id) => {
      const destination = destinations.find((item) => item.id === id);
      return destination ? [destination] : [];
    });
    void recordRecentDestinationIds(selected.map((destination) => destination.id));
    onConfirm(selected);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onShow={initialize}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <AppText variant="headingMd">{title ?? t('picker.title')}</AppText>
            <AppText variant="caption" color={colors.neutral.textSecondary}>
              {maxSelections
                ? t('picker.selectedCountWithLimit', {
                    count: draftIds.length,
                    max: maxSelections,
                  })
                : t('picker.selectedCount', { count: draftIds.length })}
            </AppText>
          </View>
          <IconButton
            accessibilityLabel={t('common.cancel')}
            icon={<X size={iconSizes.button} color={colors.neutral.textPrimary} />}
            onPress={onClose}
          />
        </View>

        <SectionList
          sections={sections}
          keyExtractor={(destination) => destination.id}
          keyboardShouldPersistTaps="handled"
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <SearchField
                value={query}
                placeholder={t('picker.searchPlaceholder')}
                accessibilityLabel={t('picker.searchAccessibility')}
                clearAccessibilityLabel={t('picker.clearSearch')}
                onChangeText={setQuery}
                onClear={() => setQuery('')}
                returnKeyType="search"
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filters}
              >
                <SelectionChip
                  label={t('picker.allCategories')}
                  selected={category === 'all'}
                  onPress={() => setCategory('all')}
                />
                {destinationCategories.map((item) => (
                  <SelectionChip
                    key={item}
                    label={t(`interest.${item}`)}
                    selected={category === item}
                    onPress={() => setCategory(item)}
                  />
                ))}
              </ScrollView>
              {allowCustomPoint && onChooseCustomPoint && (
                <Pressable
                  accessibilityRole="button"
                  onPress={onChooseCustomPoint}
                  style={({ pressed }) => [
                    styles.customPoint,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <View style={styles.customPointIcon}>
                    <MapPinned size={iconSizes.button} color={colors.teal[700]} />
                  </View>
                  <AppText variant="labelLg" color={colors.teal[700]} style={styles.rowCopy}>
                    {t('picker.customPoint')}
                  </AppText>
                </Pressable>
              )}
            </View>
          }
          renderSectionHeader={({ section }) => (
            <AppText
              variant="labelMd"
              color={colors.neutral.textSecondary}
              style={styles.sectionTitle}
            >
              {section.title}
            </AppText>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          SectionSeparatorComponent={() => <View style={styles.sectionSeparator} />}
          ListEmptyComponent={
            <EmptyState
              icon={<MapPin size={iconSizes.empty} color={colors.neutral.iconMuted} />}
              title={t('picker.emptyTitle')}
              description={t('picker.emptyDescription')}
            />
          }
          renderItem={({ item }) => {
            const selected = draftIds.includes(item.id);
            const disabled = Boolean(
              mode === 'multiple' &&
                maxSelections &&
                draftIds.length >= maxSelections &&
                !selected,
            );
            const CategoryIcon = categoryIcons[item.category];
            return (
              <Pressable
                accessibilityRole={mode === 'single' ? 'radio' : 'checkbox'}
                accessibilityState={{ selected, checked: selected, disabled }}
                accessibilityLabel={`${item.name}, ${item.regency}`}
                onPress={() => toggleDestination(item.id)}
                disabled={disabled}
                style={({ pressed }) => [
                  styles.destinationRow,
                  selected && styles.destinationRowSelected,
                  disabled && styles.destinationRowDisabled,
                  pressed && styles.rowPressed,
                ]}
              >
                <View style={styles.destinationIcon}>
                  <CategoryIcon size={iconSizes.button} color={colors.brand[600]} />
                </View>
                <View style={styles.rowCopy}>
                  <AppText variant="labelLg">{item.name}</AppText>
                  <AppText variant="caption" color={colors.neutral.textSecondary}>
                    {item.regency} · {t(`interest.${item.category}`)}
                  </AppText>
                </View>
                <View style={[styles.check, selected && styles.checkSelected]}>
                  {selected && (
                    <Check size={iconSizes.inline} color={colors.neutral.white} />
                  )}
                </View>
              </Pressable>
            );
          }}
        />

        <View style={styles.footer}>
          <AppButton
            fullWidth
            disabled={draftIds.length === 0}
            label={t('picker.useSelection')}
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
    backgroundColor: colors.neutral.surfaceSoft,
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
  content: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing[4],
    paddingBottom: 112,
  },
  listHeader: {
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  filters: {
    gap: spacing[2],
    paddingRight: spacing[4],
  },
  customPoint: {
    minHeight: layout.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.teal[300],
    borderRadius: radii.md,
    backgroundColor: colors.teal[50],
  },
  customPointIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    backgroundColor: colors.neutral.white,
  },
  sectionTitle: {
    paddingVertical: spacing[2],
    backgroundColor: colors.neutral.surfaceSoft,
  },
  destinationRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: colors.neutral.borderSoft,
    borderRadius: radii.md,
    backgroundColor: colors.neutral.white,
  },
  destinationRowSelected: {
    borderColor: colors.brand[300],
    backgroundColor: colors.brand[50],
  },
  destinationRowDisabled: {
    opacity: 0.48,
  },
  rowPressed: {
    opacity: 0.72,
  },
  destinationIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    backgroundColor: colors.brand[100],
  },
  rowCopy: {
    flex: 1,
    gap: spacing[1],
  },
  check: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral.borderStrong,
    borderRadius: radii.pill,
  },
  checkSelected: {
    borderColor: colors.brand[600],
    backgroundColor: colors.brand[600],
  },
  separator: {
    height: spacing[2],
  },
  sectionSeparator: {
    height: spacing[3],
  },
  footer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing[3],
    paddingBottom: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.neutral.borderSoft,
    backgroundColor: colors.neutral.white,
    ...shadows.md,
  },
});
