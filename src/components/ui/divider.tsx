import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '@/constants/theme';

export type DividerProps = {
  spacing?: number;
  orientation?: 'horizontal' | 'vertical';
};

export function Divider({
  spacing: dividerSpacing = spacing[4],
  orientation = 'horizontal',
}: DividerProps) {
  const isVertical = orientation === 'vertical';

  return (
    <View
      style={[
        styles.divider,
        isVertical ? styles.vertical : styles.horizontal,
        isVertical
          ? { marginHorizontal: dividerSpacing }
          : { marginVertical: dividerSpacing },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    backgroundColor: colors.neutral.borderSoft,
  },
  horizontal: {
    height: 1,
    width: '100%',
  },
  vertical: {
    width: 1,
    alignSelf: 'stretch',
  },
});
