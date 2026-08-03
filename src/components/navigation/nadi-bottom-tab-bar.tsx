import type { BottomTabBarProps } from 'expo-router/js-tabs';
import {
  Compass,
  House,
  Map,
  TriangleAlert,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui';
import {
  colors,
  iconSizes,
  layout,
  radii,
  shadows,
  spacing,
} from '@/constants/theme';

type TabName = 'index' | 'explore' | 'map' | 'alerts' | 'profile';

type TabDefinition = {
  icon: LucideIcon;
  labelKey: `tabs.${'home' | 'explore' | 'map' | 'alerts' | 'profile'}`;
};

const tabDefinitions: Record<TabName, TabDefinition> = {
  index: { icon: House, labelKey: 'tabs.home' },
  explore: { icon: Compass, labelKey: 'tabs.explore' },
  map: { icon: Map, labelKey: 'tabs.map' },
  alerts: { icon: TriangleAlert, labelKey: 'tabs.alerts' },
  profile: { icon: UserRound, labelKey: 'tabs.profile' },
};

export type NadiBottomTabBarProps = BottomTabBarProps & {
  alertCount?: number;
};

export function NadiBottomTabBar({
  state,
  descriptors,
  navigation,
  alertCount = 0,
}: NadiBottomTabBarProps) {
  const { t } = useTranslation('navigation');
  const insets = useSafeAreaInsets();
  const totalHeight = layout.bottomTabHeight + insets.bottom;
  const badgeLabel = alertCount > 99 ? '99+' : String(alertCount);

  return (
    <View
      style={[
        styles.safeArea,
        {
          height: totalHeight,
          paddingBottom: Math.max(insets.bottom, spacing[2]),
        },
      ]}
    >
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const definition = tabDefinitions[route.name as TabName];
          if (!definition) return null;

          const isFocused = state.index === index;
          const isMap = route.name === 'map';
          const isAlerts = route.name === 'alerts';
          const Icon = definition.icon;
          const label = t(definition.labelKey);
          const accessibilityLabel =
            isAlerts && alertCount > 0
              ? `${label}, ${t('accessibility.alertCount', { count: alertCount })}`
              : label;

          const handlePress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const handleLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityLabel={accessibilityLabel}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              testID={descriptors[route.key].options.tabBarButtonTestID}
              onLongPress={handleLongPress}
              onPress={handlePress}
              style={({ pressed }) => [
                styles.item,
                pressed && styles.itemPressed,
              ]}
            >
              <View
                style={[
                  styles.iconContainer,
                  isFocused && styles.iconContainerActive,
                  isMap && styles.mapIconContainer,
                  isMap && isFocused && styles.mapIconContainerActive,
                ]}
              >
                <Icon
                  size={isMap ? iconSizes.header : iconSizes.navigation}
                  color={
                    isMap && isFocused
                      ? colors.neutral.white
                      : isFocused
                        ? colors.brand[600]
                        : colors.neutral.iconMuted
                  }
                  strokeWidth={isFocused ? 2.5 : 2}
                />
                {isAlerts && alertCount > 0 && (
                  <View style={styles.badge} accessible={false}>
                    <AppText variant="micro" color={colors.neutral.white}>
                      {badgeLabel}
                    </AppText>
                  </View>
                )}
              </View>
              <AppText
                numberOfLines={1}
                variant="micro"
                color={isFocused ? colors.brand[700] : colors.neutral.textMuted}
                style={styles.label}
              >
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.neutral.surfaceSoft,
    paddingHorizontal: spacing[3],
    paddingTop: spacing[1],
  },
  bar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.neutral.white,
    borderRadius: radii.xl,
    ...shadows.md,
  },
  item: {
    flex: 1,
    minWidth: layout.minTouchTarget,
    minHeight: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: radii.lg,
  },
  itemPressed: {
    backgroundColor: colors.brand[50],
    transform: [{ scale: 0.97 }],
  },
  iconContainer: {
    minWidth: 34,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  iconContainerActive: {
    backgroundColor: colors.brand[50],
  },
  mapIconContainer: {
    minWidth: 42,
    height: 36,
    marginTop: -spacing[2],
    borderRadius: radii.md,
    backgroundColor: colors.brand[100],
  },
  mapIconContainerActive: {
    backgroundColor: colors.brand[600],
    ...shadows.sm,
  },
  badge: {
    position: 'absolute',
    top: -spacing[1],
    right: -spacing[2],
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.semantic.danger.main,
    borderWidth: 2,
    borderColor: colors.neutral.white,
  },
  label: {
    textAlign: 'center',
  },
});
