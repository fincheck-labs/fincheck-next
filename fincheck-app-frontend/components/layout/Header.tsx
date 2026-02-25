import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { useTheme } from '@/hooks/useTheme';

interface HeaderProps {
  onMenuPress?: () => void;
}

export function Header({ onMenuPress }: HeaderProps) {
  const { colors } = useTheme();

  return (
    <ThemedView style={[styles.header, { borderBottomColor: colors.border }]}>
      <View style={styles.content}>
        <ThemedText style={[styles.logo, { color: colors.primary }]}>
          Fincheck
        </ThemedText>
        
        {onMenuPress && (
          <TouchableOpacity
            onPress={onMenuPress}
            style={styles.menuButton}
            activeOpacity={0.7}
          >
            <View style={styles.hamburger}>
              <View style={[styles.hamburgerLine, { backgroundColor: colors.text }]} />
              <View style={[styles.hamburgerLine, { backgroundColor: colors.text }]} />
              <View style={[styles.hamburgerLine, { backgroundColor: colors.text }]} />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: 20,
    fontWeight: '700',
  },
  menuButton: {
    padding: 8,
  },
  hamburger: {
    gap: 5,
  },
  hamburgerLine: {
    width: 24,
    height: 2.5,
    borderRadius: 2,
  },
});