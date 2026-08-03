import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '@/constants/theme';

export type DividerProps = {
  spacing?: number;
};

export function Divider({ spacing: verticalSpacing = spacing[4] }: DividerProps) {
  return (
    <View 
      style={[
        styles.divider, 
        { marginVertical: verticalSpacing }
      ]} 
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: colors.neutral.borderSoft,
    width: '100%',
  },
});
