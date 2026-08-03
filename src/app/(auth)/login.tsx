import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { LockKeyhole, Mail } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  Pressable,
  StyleSheet,
  type TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthFormContainer } from '@/components/auth/auth-form-container';
import { PasswordField } from '@/components/auth/password-field';
import { AppButton, AppInput, AppText } from '@/components/ui';
import { colors, iconSizes, spacing } from '@/constants/theme';
import type { LoginFormErrors, LoginFormValues, ValidationKey } from '@/types/auth';
import { validateEmail, validateLogin, validatePassword } from '@/utils/auth-validation';

const initialValues: LoginFormValues = {
  email: '',
  password: '',
};

export default function LoginScreen() {
  const { t } = useTranslation(['auth', 'validation', 'common']);
  const router = useRouter();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof LoginFormValues, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const translateError = (error?: ValidationKey) =>
    error ? t(error, { ns: 'validation' }) : undefined;

  const updateValue = (field: keyof LoginFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));

    if (touched[field] || errors[field]) {
      const nextError = field === 'email' ? validateEmail(value) : validatePassword(value);
      setErrors((current) => ({ ...current, [field]: nextError }));
    }
  };

  const handleBlur = (field: keyof LoginFormValues) => {
    setTouched((current) => ({ ...current, [field]: true }));
    const error = field === 'email' ? validateEmail(values.email) : validatePassword(values.password);
    setErrors((current) => ({ ...current, [field]: error }));
  };

  const handleForgotPassword = () => {
    Alert.alert(
      t('availability.noticeTitle', { ns: 'common' }),
      t('login.forgotPasswordUnavailable', { ns: 'auth' }),
    );
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const nextErrors = validateLogin(values);
    setErrors(nextErrors);
    setTouched({ email: true, password: true });

    if (nextErrors.email) {
      emailRef.current?.focus();
      return;
    }
    if (nextErrors.password) {
      passwordRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 650));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => undefined,
    );
    AccessibilityInfo.announceForAccessibility(
      t('login.successMessage', { ns: 'auth' }),
    );
    router.replace('/(tabs)');
  };

  return (
    <AuthFormContainer
      title={t('login.title', { ns: 'auth' })}
      subtitle={t('login.subtitle', { ns: 'auth' })}
    >
      <View style={styles.form}>
        <AppInput
          ref={emailRef}
          label={t('login.emailLabel', { ns: 'auth' })}
          placeholder={t('login.emailPlaceholder', { ns: 'auth' })}
          value={values.email}
          error={translateError(errors.email)}
          editable={!isSubmitting}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          leadingIcon={<Mail size={iconSizes.button} color={colors.neutral.iconMuted} />}
          onChangeText={(value) => updateValue('email', value)}
          onBlur={() => handleBlur('email')}
          onSubmitEditing={() => passwordRef.current?.focus()}
        />

        <PasswordField
          inputRef={passwordRef}
          label={t('login.passwordLabel', { ns: 'auth' })}
          placeholder={t('login.passwordPlaceholder', { ns: 'auth' })}
          value={values.password}
          error={translateError(errors.password)}
          editable={!isSubmitting}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password"
          textContentType="password"
          returnKeyType="done"
          leadingIcon={<LockKeyhole size={iconSizes.button} color={colors.neutral.iconMuted} />}
          showPasswordLabel={t('login.showPassword', { ns: 'auth' })}
          hidePasswordLabel={t('login.hidePassword', { ns: 'auth' })}
          onChangeText={(value) => updateValue('password', value)}
          onBlur={() => handleBlur('password')}
          onSubmitEditing={() => void handleSubmit()}
        />

        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={handleForgotPassword}
          style={({ pressed }) => [styles.forgotButton, pressed && styles.linkPressed]}
        >
          <AppText variant="labelMd" color={colors.brand[600]}>
            {t('login.forgotPassword', { ns: 'auth' })}
          </AppText>
        </Pressable>

        <AppButton
          fullWidth
          size="lg"
          label={
            isSubmitting
              ? t('login.submitting', { ns: 'auth' })
              : t('login.submit', { ns: 'auth' })
          }
          loading={isSubmitting}
          onPress={() => void handleSubmit()}
        />

        <View style={styles.authNavigation}>
          <AppText variant="bodyMd" color={colors.neutral.textSecondary}>
            {t('login.noAccount', { ns: 'auth' })}
          </AppText>
          <Pressable
            accessibilityRole="link"
            disabled={isSubmitting}
            onPress={() => router.push('/register')}
            style={({ pressed }) => [styles.linkButton, pressed && styles.linkPressed]}
          >
            <AppText variant="labelLg" color={colors.brand[600]}>
              {t('login.registerAction', { ns: 'auth' })}
            </AppText>
          </Pressable>
        </View>
      </View>
    </AuthFormContainer>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing[4],
  },
  forgotButton: {
    minHeight: spacing[10] + spacing[1],
    alignSelf: 'flex-end',
    justifyContent: 'center',
    marginTop: -spacing[2],
  },
  authNavigation: {
    minHeight: spacing[10] + spacing[1],
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  linkPressed: {
    opacity: 0.64,
  },
  linkButton: {
    minHeight: spacing[10] + spacing[1],
    justifyContent: 'center',
  },
});
