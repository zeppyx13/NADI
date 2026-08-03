import type { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/ui';
import { colors, layout, spacing } from '@/constants/theme';

type AuthFormContainerProps = PropsWithChildren<{
  title: string;
  subtitle: string;
}>;

export function AuthFormContainer({ title, subtitle, children }: AuthFormContainerProps) {
  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.titleGroup}>
            <AppText variant="headingLg">{title}</AppText>
            <AppText variant="bodyMd" color={colors.neutral.textSecondary}>
              {subtitle}
            </AppText>
          </View>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: colors.neutral.white,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.neutral.white,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing[6],
    paddingBottom: spacing[5],
  },
  titleGroup: {
    gap: spacing[2],
    marginBottom: spacing[5],
  },
});
