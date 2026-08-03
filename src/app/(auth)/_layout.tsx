import { Stack } from 'expo-router';

import { AuthShell } from '@/components/auth/auth-shell';
import { colors } from '@/constants/theme';
import { AuthHeroProvider } from '@/hooks/use-auth-hero-image';

export default function AuthLayout() {
  return (
    <AuthHeroProvider>
      <AuthShell>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: colors.neutral.white },
          }}
        >
          <Stack.Screen name="login" options={{ gestureEnabled: false }} />
          <Stack.Screen name="register" />
        </Stack>
      </AuthShell>
    </AuthHeroProvider>
  );
}
