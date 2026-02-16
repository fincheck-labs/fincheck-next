import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/useTheme';

type Mode = 'SINGLE' | 'DATASET';

interface EvaluationModeSelectorProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
}

export default function EvaluationModeSelector({
  mode,
  setMode,
}: EvaluationModeSelectorProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => setMode('SINGLE')}
        style={[
          styles.button,
          {
            backgroundColor: mode === 'SINGLE' ? colors.primary : 'transparent',
            borderColor: mode === 'SINGLE' ? colors.primary : colors.border,
          },
        ]}
        activeOpacity={0.7}
      >
        <ThemedText
          style={[
            styles.buttonText,
            { color: mode === 'SINGLE' ? '#ffffff' : colors.text },
          ]}
        >
          Single Image
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setMode('DATASET')}
        style={[
          styles.button,
          {
            backgroundColor: mode === 'DATASET' ? colors.primary : 'transparent',
            borderColor: mode === 'DATASET' ? colors.primary : colors.border,
          },
        ]}
        activeOpacity={0.7}
      >
        <ThemedText
          style={[
            styles.buttonText,
            { color: mode === 'DATASET' ? '#ffffff' : colors.text },
          ]}
        >
          Dataset / ZIP
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});