import { StatusBar } from 'expo-status-bar';
import { usePathname, useRouter } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout, radii } from '@/constants/theme';

import { AuthHero } from './auth-hero';

export function AuthShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const isRegisterRoute = pathname.endsWith('/register');

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/login');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AuthHero onBack={isRegisterRoute ? handleBack : undefined} />
      <SafeAreaView style={styles.sheet} edges={['left', 'right', 'bottom']}>
        <View style={styles.navigator}>{children}</View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.brand[700],
  },
  sheet: {
    flex: 1,
    marginTop: -layout.authSheetOverlap,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    backgroundColor: colors.neutral.white,
    overflow: 'hidden',
  },
  navigator: {
    flex: 1,
    backgroundColor: colors.neutral.white,
  },
});
