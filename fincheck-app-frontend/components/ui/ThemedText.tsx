import React from 'react';
import { Text, TextProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export interface ThemedTextProps extends TextProps {
  lightColor?: string;
  darkColor?: string;
}

export function ThemedText({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedTextProps) {
  const { colors, isDark } = useTheme();
  
  const color = isDark
    ? darkColor || colors.text
    : lightColor || colors.text;

  return <Text style={[{ color }, style]} {...otherProps} />;
}