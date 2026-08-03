import { useRouter } from 'expo-router';
import { BellOff } from 'lucide-react-native';
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

import { TravelAlertCard } from '@/components/alerts/travel-alert-card';
import { MainScreenHeader } from '@/components/layout/main-screen-header';
import { AppBadge, AppText, EmptyState } from '@/components/ui';
import {
  colors,
  iconSizes,
  layout,
  radii,
  spacing,
} from '@/constants/theme';
import { travelAlerts } from '@/data/alerts';
import type { TravelAlertScope } from '@/types/travel-alert';

type AlertFilter = 'all' | TravelAlertScope;

const alertFilters: readonly AlertFilter[] = [
  'all',
  'nearby',
  'route',
  'destination',
];

export default function AlertsScreen() {
  const { t } = useTranslation('screens');
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<AlertFilter>('all');
  const unreadCount = travelAlerts.filter((alert) => !alert.isRead).length;
  const filteredAlerts = useMemo(
    () =>
      activeFilter === 'all'
        ? travelAlerts
        : travelAlerts.filter((alert) => alert.scope === activeFilter),
    [activeFilter],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <FlatList
        data={filteredAlerts}
        keyExtractor={(alert) => alert.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <MainScreenHeader
              title={t('alerts.title')}
              subtitle={t('alerts.subtitle')}
              rightAction={
                unreadCount > 0 ? (
                  <AppBadge
                    variant="danger"
                    label={t('alerts.unreadCount', { count: unreadCount })}
                  />
                ) : undefined
              }
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
            >
              {alertFilters.map((filter) => {
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
                      {t(`alerts.filters.${filter}`)}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon={<BellOff size={iconSizes.empty} color={colors.neutral.iconMuted} />}
            title={t('alerts.emptyTitle')}
            description={t('alerts.emptyDescription')}
          />
        }
        renderItem={({ item }) => (
          <TravelAlertCard
            alert={item}
            onViewMap={() =>
              router.push({
                pathname: '/(tabs)/map',
                params: { alertId: item.id },
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
