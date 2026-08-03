import { Eye, EyeOff } from 'lucide-react-native';
import { useState, type Ref } from 'react';
import type { TextInput } from 'react-native';

import { AppInput, IconButton, type AppInputProps } from '@/components/ui';
import { colors, iconSizes } from '@/constants/theme';

type PasswordFieldProps = Omit<
  AppInputProps,
  'secureTextEntry' | 'trailingIcon' | 'accessibilityLabel'
> & {
  inputRef?: Ref<TextInput>;
  showPasswordLabel: string;
  hidePasswordLabel: string;
};

export function PasswordField({
  inputRef,
  showPasswordLabel,
  hidePasswordLabel,
  label,
  ...rest
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const toggleLabel = isVisible ? hidePasswordLabel : showPasswordLabel;

  return (
    <AppInput
      ref={inputRef}
      label={label}
      accessibilityLabel={label}
      secureTextEntry={!isVisible}
      trailingIcon={
        <IconButton
          accessibilityLabel={toggleLabel}
          accessibilityState={{ expanded: isVisible }}
          icon={
            isVisible ? (
              <EyeOff size={iconSizes.button} color={colors.neutral.iconMuted} />
            ) : (
              <Eye size={iconSizes.button} color={colors.neutral.iconMuted} />
            )
          }
          onPress={() => setIsVisible((current) => !current)}
        />
      }
      {...rest}
    />
  );
}
