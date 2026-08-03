import type {
  LoginFormErrors,
  LoginFormValues,
  RegisterFormErrors,
  RegisterFormValues,
  ValidationKey,
} from '@/types/auth';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): ValidationKey | undefined {
  const normalizedEmail = email.trim();
  if (!normalizedEmail) return 'emailRequired';
  if (!emailPattern.test(normalizedEmail)) return 'emailInvalid';
  return undefined;
}

export function validatePassword(password: string): ValidationKey | undefined {
  if (!password) return 'passwordRequired';
  if (password.length < 8) return 'passwordTooShort';
  return undefined;
}

export function validateLogin(values: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {};
  const emailError = validateEmail(values.email);
  const passwordError = validatePassword(values.password);

  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;
  return errors;
}

export function validateRegister(values: RegisterFormValues): RegisterFormErrors {
  const errors: RegisterFormErrors = {};
  const normalizedName = values.fullName.trim();
  const emailError = validateEmail(values.email);
  const passwordError = validatePassword(values.password);

  if (!normalizedName) {
    errors.fullName = 'nameRequired';
  } else if (normalizedName.length < 2) {
    errors.fullName = 'nameTooShort';
  }

  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;

  if (!values.confirmPassword) {
    errors.confirmPassword = 'confirmPasswordRequired';
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'passwordMismatch';
  }

  if (!values.acceptedTerms) errors.acceptedTerms = 'termsRequired';
  return errors;
}
