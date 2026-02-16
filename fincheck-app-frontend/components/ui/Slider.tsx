import React from 'react';
import { View, StyleSheet } from 'react-native';
import RNSlider from '@react-native-community/slider';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/useTheme';

interface SliderProps {
  label: string;
  value: number;
  setValue: (value: number) => void;
  min: number;
  max: number;
  step?: number;
}

export default function Slider({
  label,
  value,
  setValue,
  min,
  max,
  step = 1,
}: SliderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <RNSlider
        value={value}
        onValueChange={setValue}
        minimumValue={min}
        maximumValue={max}
        step={step}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.primary}
        style={styles.slider}
      />
      <ThemedText style={[styles.valueText, { opacity: 0.6 }]}>
        {value.toFixed(step < 1 ? 2 : 0)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  valueText: {
    fontSize: 12,
    marginTop: 4,
  },
});