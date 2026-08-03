export type LoginFormValues = {
  email: string;
  password: string;
};

export type RegisterFormValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
};

export type ValidationKey =
  | 'nameRequired'
  | 'nameTooShort'
  | 'emailRequired'
  | 'emailInvalid'
  | 'passwordRequired'
  | 'passwordTooShort'
  | 'confirmPasswordRequired'
  | 'passwordMismatch'
  | 'termsRequired';

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, ValidationKey>>;
export type RegisterFormErrors = Partial<Record<keyof RegisterFormValues, ValidationKey>>;
