import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Check, LockKeyhole, Mail, UserRound } from 'lucide-react-native';
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

import { AuthScreenLayout } from '@/components/auth/auth-screen-layout';
import { PasswordField } from '@/components/auth/password-field';
import { AppButton, AppInput, AppText } from '@/components/ui';
import { colors, iconSizes, layout, radii, spacing } from '@/constants/theme';
import type {
  RegisterFormErrors,
  RegisterFormValues,
  ValidationKey,
} from '@/types/auth';
import { validateRegister } from '@/utils/auth-validation';

const initialValues: RegisterFormValues = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptedTerms: false,
};

type RegisterField = keyof RegisterFormValues;

export default function RegisterScreen() {
  const { t } = useTranslation(['auth', 'validation', 'common']);
  const router = useRouter();
  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<RegisterField, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const translateError = (error?: ValidationKey) =>
    error ? t(error, { ns: 'validation' }) : undefined;

  const validateField = (field: RegisterField, nextValues = values) =>
    validateRegister(nextValues)[field];

  const updateValue = <Field extends RegisterField>(
    field: Field,
    value: RegisterFormValues[Field],
  ) => {
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);

    if (touched[field] || errors[field]) {
      setErrors((current) => ({
        ...current,
        [field]: validateField(field, nextValues),
        ...(field === 'password' && (touched.confirmPassword || errors.confirmPassword)
          ? { confirmPassword: validateField('confirmPassword', nextValues) }
          : {}),
      }));
    }
  };

  const handleBlur = (field: RegisterField) => {
    setTouched((current) => ({ ...current, [field]: true }));
    setErrors((current) => ({ ...current, [field]: validateField(field) }));
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/login');
    }
  };

  const handleTermsPress = () => {
    Alert.alert(
      t('prototype.noticeTitle', { ns: 'common' }),
      t('register.termsUnavailable', { ns: 'auth' }),
    );
  };

  const focusFirstError = (nextErrors: RegisterFormErrors) => {
    if (nextErrors.fullName) return nameRef.current?.focus();
    if (nextErrors.email) return emailRef.current?.focus();
    if (nextErrors.password) return passwordRef.current?.focus();
    if (nextErrors.confirmPassword) return confirmPasswordRef.current?.focus();
    return undefined;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const nextErrors = validateRegister(values);
    setErrors(nextErrors);
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
      acceptedTerms: true,
    });

    if (Object.keys(nextErrors).length > 0) {
      focusFirstError(nextErrors);
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 650));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => undefined,
    );
    AccessibilityInfo.announceForAccessibility(
      t('register.successMessage', { ns: 'auth' }),
    );
    router.replace('/home');
  };

  return (
    <AuthScreenLayout
      title={t('register.title', { ns: 'auth' })}
      subtitle={t('register.subtitle', { ns: 'auth' })}
      onBack={handleBack}
    >
      <View style={styles.form}>
        <AppInput
          ref={nameRef}
          label={t('register.nameLabel', { ns: 'auth' })}
          placeholder={t('register.namePlaceholder', { ns: 'auth' })}
          value={values.fullName}
          error={translateError(errors.fullName)}
          editable={!isSubmitting}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          leadingIcon={<UserRound size={iconSizes.button} color={colors.neutral.iconMuted} />}
          onChangeText={(value) => updateValue('fullName', value)}
          onBlur={() => handleBlur('fullName')}
          onSubmitEditing={() => emailRef.current?.focus()}
        />

        <AppInput
          ref={emailRef}
          label={t('register.emailLabel', { ns: 'auth' })}
          placeholder={t('register.emailPlaceholder', { ns: 'auth' })}
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
          label={t('register.passwordLabel', { ns: 'auth' })}
          placeholder={t('register.passwordPlaceholder', { ns: 'auth' })}
          value={values.password}
          error={translateError(errors.password)}
          editable={!isSubmitting}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          leadingIcon={<LockKeyhole size={iconSizes.button} color={colors.neutral.iconMuted} />}
          showPasswordLabel={t('register.showPassword', { ns: 'auth' })}
          hidePasswordLabel={t('register.hidePassword', { ns: 'auth' })}
          onChangeText={(value) => updateValue('password', value)}
          onBlur={() => handleBlur('password')}
          onSubmitEditing={() => confirmPasswordRef.current?.focus()}
        />

        <PasswordField
          inputRef={confirmPasswordRef}
          label={t('register.confirmPasswordLabel', { ns: 'auth' })}
          placeholder={t('register.confirmPasswordPlaceholder', { ns: 'auth' })}
          value={values.confirmPassword}
          error={translateError(errors.confirmPassword)}
          editable={!isSubmitting}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          leadingIcon={<LockKeyhole size={iconSizes.button} color={colors.neutral.iconMuted} />}
          showPasswordLabel={t('register.showConfirmPassword', { ns: 'auth' })}
          hidePasswordLabel={t('register.hideConfirmPassword', { ns: 'auth' })}
          onChangeText={(value) => updateValue('confirmPassword', value)}
          onBlur={() => handleBlur('confirmPassword')}
          onSubmitEditing={() => void handleSubmit()}
        />

        <View style={styles.termsBlock}>
          <View style={styles.termsRow}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityLabel={t('register.termsAgreementLabel', { ns: 'auth' })}
              accessibilityState={{ checked: values.acceptedTerms }}
              disabled={isSubmitting}
              onPress={() => updateValue('acceptedTerms', !values.acceptedTerms)}
              style={({ pressed }) => [
                styles.checkbox,
                values.acceptedTerms && styles.checkboxSelected,
                pressed && styles.controlPressed,
              ]}
            >
              {values.acceptedTerms && (
                <Check size={iconSizes.badge} color={colors.neutral.white} />
              )}
            </Pressable>
            <View style={styles.termsCopy}>
              <AppText variant="bodySm" color={colors.neutral.textSecondary}>
                {t('register.termsPrefix', { ns: 'auth' })}
              </AppText>
              <Pressable
                accessibilityRole="link"
                onPress={handleTermsPress}
                style={({ pressed }) => [styles.inlineLinkButton, pressed && styles.controlPressed]}
              >
                <AppText
                  variant="labelMd"
                  color={colors.brand[600]}
                >
                  {t('register.termsAction', { ns: 'auth' })}
                </AppText>
              </Pressable>
            </View>
          </View>
          {errors.acceptedTerms && (
            <AppText variant="caption" color={colors.semantic.danger.text}>
              {translateError(errors.acceptedTerms)}
            </AppText>
          )}
        </View>

        <AppButton
          fullWidth
          size="lg"
          label={
            isSubmitting
              ? t('register.submitting', { ns: 'auth' })
              : t('register.submit', { ns: 'auth' })
          }
          loading={isSubmitting}
          onPress={() => void handleSubmit()}
        />

        <View style={styles.authNavigation}>
          <AppText variant="bodyMd" color={colors.neutral.textSecondary}>
            {t('register.haveAccount', { ns: 'auth' })}
          </AppText>
          <Pressable
            accessibilityRole="link"
            disabled={isSubmitting}
            onPress={() => router.replace('/login')}
            style={({ pressed }) => [styles.linkButton, pressed && styles.controlPressed]}
          >
            <AppText variant="labelLg" color={colors.brand[600]}>
              {t('register.loginAction', { ns: 'auth' })}
            </AppText>
          </Pressable>
        </View>
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing[4],
  },
  termsBlock: {
    gap: spacing[1],
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  checkbox: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.neutral.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: colors.brand[500],
    backgroundColor: colors.brand[500],
  },
  termsCopy: {
    flex: 1,
    minHeight: layout.minTouchTarget,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing[1],
  },
  inlineLinkButton: {
    minHeight: layout.minTouchTarget,
    justifyContent: 'center',
  },
  authNavigation: {
    minHeight: layout.minTouchTarget,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  controlPressed: {
    opacity: 0.64,
  },
  linkButton: {
    minHeight: layout.minTouchTarget,
    justifyContent: 'center',
  },
});
