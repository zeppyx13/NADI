import React, { type ReactNode } from 'react';
import { View, ScrollView, StyleSheet, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors, layout } from '@/constants/theme';

export type ScreenContainerProps = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  backgroundColor?: string;
  edges?: Edge[];
  style?: ViewStyle;
};

export function ScreenContainer({
  children,
  scroll = false,
  padded = true,
  backgroundColor = colors.neutral.surfaceSoft,
  edges = ['top', 'left', 'right'],
  style,
}: ScreenContainerProps) {
  const contentStyle = [
    styles.content,
    padded && { paddingHorizontal: layout.screenPadding },
    style,
  ];

  const content = scroll ? (
    <ScrollView 
      style={styles.flex} 
      contentContainerStyle={contentStyle}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, contentStyle]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor }]} 
      edges={edges}
    >
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
});
