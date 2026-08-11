import '@/utils/maplibre-polyfill';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Stack } from 'expo-router';

import { colors } from '@/constants/theme';
import { ItineraryProvider } from '@/context/itinerary-context';
import { bootstrapI18n } from '@/i18n';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [i18nReady, setI18nReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    let isMounted = true;

    void bootstrapI18n().finally(() => {
      if (isMounted) setI18nReady(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const appReady = (fontsLoaded || !!fontError) && i18nReady;

  useEffect(() => {
    if (appReady) void SplashScreen.hideAsync();
  }, [appReady]);

  if (!appReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ItineraryProvider>
        <View style={styles.root}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: styles.content,
            }}
          />
        </View>
      </ItineraryProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.neutral.surfaceSoft,
  },
  content: {
    backgroundColor: colors.neutral.surfaceSoft,
  },
});
