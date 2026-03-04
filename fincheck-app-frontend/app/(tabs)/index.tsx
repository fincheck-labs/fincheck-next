import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
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

  const compressionTechniques = [
    { label: 'Pruning', desc: 'Remove redundant weights' },
    { label: 'Quantization', desc: 'Reduce numerical precision' },
    { label: 'Low-Rank Factorization', desc: 'Decompose weight matrices' },
    { label: 'Knowledge Distillation', desc: 'Transfer knowledge from teacher model' },
    { label: 'Weight Sharing', desc: 'Cluster and reuse parameters' },
  ];

  const systemSpecs = [
    { label: 'Dataset', value: 'MNIST (28×28 grayscale digits)' },
    { label: 'Architecture', value: 'Conv → ReLU → Pool → FC' },
    { label: 'Compression Methods', value: '5 Techniques' },
    { label: 'Optimization Engine', value: 'Genetic Algorithm' },
    { label: 'Fitness Objective', value: 'Normalized FAR / FRR Log-Risk' },
  ];

  const gaParams = [
    'Max Generations: 200',
    'Population Size: 20',
    'Elite Retention: 4',
    'Tournament Selection',
    'Crossover Blending',
    'Adaptive Mutation Decay',
    'Diversity Injection',
    'Early Convergence Detection',
  ];

  const evolutionSteps = [
    'Tournament-based parent selection',
    'Elitism to preserve top solutions',
    'Blended crossover for smooth interpolation',
    'Adaptive mutation with sigma decay',
    'Diversity reinjection when population collapses',
    'Stagnation-based recovery mechanism',
  ];

  const evaluationItems = [
    'Accuracy on Clean Inputs',
    'Robustness to Noise',
    'Model Size Reduction',
    'Inference Latency',
    'FAR / FRR Trade-off',
    'Entropy Stability',
    'Confidence Calibration',
    'Deployment Feasibility',
  ];

  const teamMembers = [
    { name: 'Sai Vikas', id: 'CB.EN.U4CSE22363' },
    { name: 'Albert', id: 'CB.EN.U4CSE22505' },
    { name: 'Rathna', id: 'CB.EN.U4CSE22526' },
    { name: 'Mukesh', id: 'CB.EN.U4CSE22531' },
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
        {/* ── Hero ── */}
        <View style={styles.section}>
          <View style={styles.heroDivider} />
          <ThemedText style={styles.title}>
            Efficient CNN Model Compression &amp; Confidence-Aware Risk Optimization
          </ThemedText>
          <ThemedText style={[styles.paragraph, styles.muted]}>
            This research explores the trade-off between computational efficiency
            and predictive reliability in compressed Convolutional Neural Networks
            (CNNs). By integrating model compression techniques with a Genetic
            Algorithm–based risk weighting engine, the system identifies
            deployment-ready models optimized for real-world resource-constrained
            environments.
          </ThemedText>
        </View>

        {/* ── Project Overview ── */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Project Overview</ThemedText>
          <ThemedText style={[styles.paragraph, styles.muted]}>
            Modern CNNs deliver state-of-the-art accuracy but demand significant
            memory and computation. This project evaluates structured and
            unstructured compression strategies to reduce model size and latency
            while preserving reliability.
          </ThemedText>

          <View style={[styles.techniqueCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            {compressionTechniques.map((item) => (
              <View key={item.label} style={styles.techniqueRow}>
                <ThemedText style={styles.bold}>{item.label}</ThemedText>
                <ThemedText style={[styles.small, styles.muted]}>
                  {' — '}{item.desc}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* ── System Specifications ── */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>System Specifications</ThemedText>
          <View style={[styles.specsCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            {systemSpecs.map((spec) => (
              <View key={spec.label} style={styles.specRow}>
                <ThemedText style={styles.specLabel}>{spec.label}</ThemedText>
                <ThemedText style={[styles.specValue, styles.bold]}>{spec.value}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* ── Risk Optimization Engine ── */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            Confidence-Aware Risk Weight Evolution
          </ThemedText>
          <ThemedText style={[styles.paragraph, styles.muted]}>
            The system optimizes the trade-off between False Acceptance Rate (FAR)
            and False Rejection Rate (FRR) using a Genetic Algorithm. A single
            weighting parameter α is evolved to minimize total normalized risk
            across all compressed models.
          </ThemedText>

          {/* Formula block */}
          <View style={[styles.formulaBox, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <ThemedText style={styles.formula}>
              Risk(α) = α · log(FAR_norm) + (1 − α) · log(FRR_norm)
            </ThemedText>
          </View>

          <ThemedText style={[styles.paragraph, styles.muted]}>
            Log-scaling stabilizes optimization, preventing dominance from skewed
            distributions. Interior regularization and soft boundary penalties
            prevent collapse toward extreme α values.
          </ThemedText>

          {/* GA parameters grid */}
          <View style={styles.chipGrid}>
            {gaParams.map((item) => (
              <View
                key={item}
                style={[styles.chip, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
              >
                <ThemedText style={styles.chipText}>{item}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* ── Evolution Strategy ── */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Evolution Strategy Design</ThemedText>
          <ThemedText style={[styles.paragraph, styles.muted]}>
            The Genetic Algorithm evolves α using controlled stochastic search:
          </ThemedText>
          {evolutionSteps.map((step) => (
            <View key={step} style={styles.bulletRow}>
              <ThemedText style={[styles.bullet, styles.muted]}>•</ThemedText>
              <ThemedText style={[styles.paragraph, styles.muted, styles.bulletText]}>
                {step}
              </ThemedText>
            </View>
          ))}
          <ThemedText style={[styles.paragraph, styles.muted]}>
            Convergence occurs when improvement falls below tolerance and
            stagnation persists across generations.
          </ThemedText>
        </View>

        {/* ── Evaluation Criteria ── */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Evaluation Criteria</ThemedText>
          <View style={styles.chipGrid}>
            {evaluationItems.map((item) => (
              <View
                key={item}
                style={[styles.chip, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
              >
                <ThemedText style={styles.chipText}>{item}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* ── Research Objective ── */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Research Objective</ThemedText>
          <ThemedText style={[styles.paragraph, styles.muted]}>
            The objective is to identify compression strategies that minimize
            computational cost while preserving predictive reliability. The
            risk-weight evolution mechanism ensures deployment-aware decision
            calibration for financial-grade validation systems.
          </ThemedText>
        </View>

        {/* ── Team Members ── */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Research Team</ThemedText>
          <View style={styles.grid}>
            {teamMembers.map((member) => (
              <View
                key={member.id}
                style={[
                  styles.memberCard,
                  { backgroundColor: colors.cardBackground, borderColor: colors.border },
                ]}
              >
                <ThemedText style={styles.memberName}>{member.name}</ThemedText>
                <ThemedText style={[styles.memberId, styles.muted]}>{member.id}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 48 },

  section: { marginBottom: 48 },

  heroDivider: {
    width: 4,
    height: 48,
    borderRadius: 4,
    backgroundColor: '#6366f1',
    marginBottom: 16,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 14,
    lineHeight: 34,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 14,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
  },
  bold: { fontWeight: '600' },
  small: { fontSize: 14 },
  muted: { opacity: 0.7 },

  // Compression technique list inside a card
  techniqueCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  techniqueRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingVertical: 4,
  },

  // Spec rows
  specsCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 4,
  },
  specLabel: { fontSize: 14, opacity: 0.8, flex: 1 },
  specValue: { fontSize: 14, textAlign: 'right', flexShrink: 1 },

  // Formula
  formulaBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  formula: {
    fontFamily: 'Courier New',
    fontSize: 13,
    lineHeight: 20,
  },

  // Chip grid (GA params, evaluation criteria)
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  chip: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipText: { fontSize: 13 },

  // Bullet list
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bullet: { fontSize: 16, marginRight: 8, lineHeight: 24 },
  bulletText: { flex: 1, marginBottom: 0 },

  // Team member cards
  grid: { gap: 14 },
  memberCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  memberName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  memberId: { fontSize: 13 },
});