import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedText } from '@/components/ui/ThemedText';
import { Header } from '@/components/layout/Header';
import { Drawer } from '@/components/layout/Drawer';
import { useTheme } from '@/hooks/useTheme';

export default function HomeScreen() {
  const { colors, toggleTheme } = useTheme();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const openDrawer = () => setDrawerVisible(true);
  const closeDrawer = () => setDrawerVisible(false);

  const evaluationItems = [
    "Model accuracy on clean inputs",
    "Inference time performance",
    "Model size and memory footprint",
    "Robustness against noisy inputs",
  ];

  const teamMembers = [
    { name: "Sai Vikas", id: "CB.EN.U4CSE22363" },
    { name: "Albert", id: "CB.EN.U4CSE22505" },
    { name: "Rathna", id: "CB.EN.U4CSE22526" },
    { name: "Mukesh", id: "CB.EN.U4CSE22531" },
  ];

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
        {/* Hero / Introduction */}
        <View style={styles.section}>
          <ThemedText style={styles.title}>
            Efficient CNN Model Compression Analysis
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            Convolutional Neural Networks (CNNs) achieve state-of-the-art
            performance in image recognition tasks. However, their high
            computational and memory requirements often make deployment
            challenging on resource-constrained devices.
          </ThemedText>
        </View>

        {/* Project Overview */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            Project Overview
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            Several model compression techniques—such as{' '}
            <ThemedText style={styles.bold}>pruning</ThemedText>,{' '}
            <ThemedText style={styles.bold}>quantization</ThemedText>,{' '}
            <ThemedText style={styles.bold}>low-rank factorization</ThemedText>,{' '}
            <ThemedText style={styles.bold}>knowledge distillation</ThemedText>, and{' '}
            <ThemedText style={styles.bold}>weight sharing</ThemedText>—have been
            proposed to reduce model complexity.
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            This project evaluates these five techniques using a standard CNN
            trained on the <ThemedText style={styles.bold}>MNIST dataset</ThemedText>,
            focusing on efficiency vs reliability trade-offs.
          </ThemedText>
        </View>

        {/* Evaluation Criteria */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            Evaluation Criteria
          </ThemedText>

          <View style={styles.grid}>
            {evaluationItems.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.card,
                  { 
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border 
                  }
                ]}
              >
                <ThemedText style={styles.cardText}>{item}</ThemedText>
              </View>
            ))}
          </View>

          <ThemedText style={[styles.paragraph, styles.muted]}>
            In addition to clean datasets, noise-added datasets are used to
            evaluate robustness based on accuracy and inference time.
          </ThemedText>
        </View>

        {/* Objective */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            Objective
          </ThemedText>

          <ThemedText style={[styles.paragraph, styles.muted]}>
            The study provides insights into the trade-offs between computational
            efficiency and predictive reliability for deployment in
            resource-constrained environments.
          </ThemedText>
        </View>

        {/* Team Members */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            Team Members
          </ThemedText>

          <View style={styles.grid}>
            {teamMembers.map((member) => (
              <View
                key={member.id}
                style={[
                  styles.memberCard,
                  { 
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border 
                  }
                ]}
              >
                <ThemedText style={styles.memberName}>
                  {member.name}
                </ThemedText>
                <ThemedText style={[styles.memberId, styles.muted]}>
                  {member.id}
                </ThemedText>
              </View>
            ))}
          </View>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 12,
  },
  bold: {
    fontWeight: '600',
  },
  muted: {
    opacity: 0.7,
  },
  grid: {
    gap: 16,
    marginBottom: 16,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  cardText: {
    fontSize: 14,
  },
  memberCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  memberId: {
    fontSize: 14,
  },
});