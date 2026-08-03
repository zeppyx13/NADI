import { useRouter } from 'expo-router';
import { SearchX } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { DestinationCard } from '@/components/destination/destination-card';
import { MainScreenHeader } from '@/components/layout/main-screen-header';
import { AppText, EmptyState, SearchField } from '@/components/ui';
import {
  colors,
  iconSizes,
  layout,
  radii,
  spacing,
} from '@/constants/theme';
import { destinations } from '@/data/destinations';
import type { DestinationCategory } from '@/types/destination';

type ExploreFilter = 'all' | DestinationCategory;

const filters: readonly ExploreFilter[] = [
  'all',
  'beach',
  'culture',
  'nature',
  'spiritual',
  'culinary',
];

export default function ExploreScreen() {
  const { t } = useTranslation('screens');
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ExploreFilter>('all');

  const filteredDestinations = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return destinations.filter((destination) => {
      const matchesFilter =
        activeFilter === 'all' || destination.category === activeFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        destination.name.toLocaleLowerCase().includes(normalizedQuery) ||
        destination.region.toLocaleLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, query]);

  const resetFilters = () => {
    setActiveFilter('all');
    setQuery('');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <FlatList
        data={filteredDestinations}
        keyExtractor={(destination) => destination.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <MainScreenHeader
              title={t('explore.title')}
              subtitle={t('explore.subtitle')}
            />
            <SearchField
              value={query}
              placeholder={t('explore.searchPlaceholder')}
              accessibilityLabel={t('explore.searchAccessibility')}
              clearAccessibilityLabel={t('explore.clearSearch')}
              onChangeText={setQuery}
              onClear={() => setQuery('')}
              returnKeyType="search"
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
            >
              {filters.map((filter) => {
                const selected = activeFilter === filter;
                return (
                  <Pressable
                    key={filter}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => setActiveFilter(filter)}
                    style={({ pressed }) => [
                      styles.filter,
                      selected && styles.filterSelected,
                      pressed && styles.filterPressed,
                    ]}
                  >
                    <AppText
                      variant="labelMd"
                      color={
                        selected ? colors.neutral.white : colors.neutral.textSecondary
                      }
                    >
                      {t(`explore.filters.${filter}`)}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
            <AppText variant="caption" color={colors.neutral.textSecondary}>
              {t('explore.resultCount', { count: filteredDestinations.length })}
            </AppText>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon={<SearchX size={iconSizes.empty} color={colors.neutral.iconMuted} />}
            title={t('explore.emptyTitle')}
            description={t('explore.emptyDescription')}
            action={{ label: t('explore.resetFilter'), onPress: resetFilters }}
          />
        }
        renderItem={({ item }) => (
          <DestinationCard
            destination={item}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/map',
                params: { destinationId: item.id },
              })
            }
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral.surfaceSoft,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
  },
  headerContent: {
    gap: spacing[4],
    marginBottom: spacing[4],
  },
  filters: {
    gap: spacing[2],
    paddingRight: spacing[4],
  },
  filter: {
    minHeight: layout.minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.neutral.borderSoft,
    backgroundColor: colors.neutral.white,
  },
  filterSelected: {
    borderColor: colors.brand[600],
    backgroundColor: colors.brand[600],
  },
  filterPressed: {
    opacity: 0.72,
  },
  itemSeparator: {
    height: spacing[3],
  },
});
