import Tabs from 'expo-router/js-tabs';

import { NadiBottomTabBar } from '@/components/navigation/nadi-bottom-tab-bar';
import { travelAlerts } from '@/data/alerts';

const unreadAlertCount = travelAlerts.filter((alert) => !alert.isRead).length;

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => (
        <NadiBottomTabBar {...props} alertCount={unreadAlertCount} />
      )}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="map" />
      <Tabs.Screen name="alerts" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
