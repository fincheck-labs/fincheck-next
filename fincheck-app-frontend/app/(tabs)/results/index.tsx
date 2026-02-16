import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedText } from '@/components/ui/ThemedText';
import { Header } from '@/components/layout/Header';
import { Drawer } from '@/components/layout/Drawer';
import { useTheme } from '@/hooks/useTheme';

export default function ResultsScreen() {
  const { colors, toggleTheme } = useTheme();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const openDrawer = () => setDrawerVisible(true);
  const closeDrawer = () => setDrawerVisible(false);

  return (
    <ThemedView style={styles.container}>
      <Header onMenuPress={openDrawer} />
      <Drawer 
        visible={drawerVisible} 
        onClose={closeDrawer}
        onThemeToggle={toggleTheme}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <ThemedText style={styles.title}>Results</ThemedText>
          <ThemedText style={styles.paragraph}>
            View and analyze your CNN model compression results.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.5,
    marginBottom: 16,
    lineHeight: 36,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 12,
  },
});