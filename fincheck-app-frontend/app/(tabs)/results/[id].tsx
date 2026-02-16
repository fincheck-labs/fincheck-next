import React, { useState, useEffect, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedText } from '@/components/ui/ThemedText';
import { Header } from '@/components/layout/Header';
import { Drawer } from '@/components/layout/Drawer';
import Dropdown from '@/components/ui/Dropdown';
import BarChart from '@/components/charts/BarChartMobile';
import ConfusionMatrix from '@/components/confusion-matrix/ConfusionMatrix';
import { useTheme } from '@/hooks/useTheme';

const MODEL_ORDER = [
  'baseline_mnist.pth',
  'kd_mnist.pth',
  'lrf_mnist.pth',
  'pruned_mnist.pth',
  'quantized_mnist.pth',
  'ws_mnist.pth',
];

const SAFE_THRESHOLD = 0.15;

type ResultDoc = {
  data: {
    MNIST?: Record<string, any>;
    CIFAR?: Record<string, any>;
  };
  meta?: {
    evaluation_type?: 'SINGLE' | 'DATASET';
    source?: 'PREBUILT' | 'CUSTOM' | 'IMAGE_UPLOAD';
    dataset_type?: string;
    num_images?: number;
  };
};

type ChartItemWithRisk = {
  model: string;
  confidence_percent: number;
  confidence_std: number;
  latency_ms: number;
  latency_std: number;
  entropy: number;
  entropy_std: number;
  stability: number;
  stability_std: number;
  ram_delta_mb: number;
  risk_score: number;
};

export default function ResultDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, toggleTheme } = useTheme();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const [doc, setDoc] = useState<ResultDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedModel, setSelectedModel] = useState('ALL');
  const [showAllModels, setShowAllModels] = useState(true);

  const openDrawer = () => setDrawerVisible(true);
  const closeDrawer = () => setDrawerVisible(false);

  useEffect(() => {
    if (!id) return;

    fetch(`http://localhost:8000/api/results/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data) => setDoc(data))
      .catch((error) => {
        console.error('Error fetching result:', error);
        // Use mock data for testing
        setDoc(getMockResultDetail());
      })
      .finally(() => setLoading(false));
  }, [id]);

  const mnistData = doc?.data?.MNIST;
  const datasetType = doc?.meta?.dataset_type;
  const hasCifar = !!doc?.data?.CIFAR;

  const chartData = useMemo<ChartItemWithRisk[]>(() => {
    if (!mnistData) return [];

    return MODEL_ORDER.map((model) => {
      const v = mnistData[model] ?? {};

      return {
        model,
        confidence_percent: v.confidence_percent ?? v.confidence_mean ?? 0,
        confidence_std: v.confidence_std ?? 0,
        latency_ms: v.latency_ms ?? v.latency_mean ?? 0,
        latency_std: v.latency_std ?? 0,
        entropy: v.entropy ?? v.entropy_mean ?? 0,
        entropy_std: v.entropy_std ?? 0,
        stability: v.stability ?? v.stability_mean ?? 0,
        stability_std: v.stability_std ?? 0,
        ram_delta_mb: v.ram_mb ?? 0,
        risk_score: v.evaluation?.risk_score ?? 1,
      };
    });
  }, [mnistData]);

  function scoreModel(m: ChartItemWithRisk, datasetType?: string) {
    if (!datasetType) return -m.latency_ms;
    return (
      m.confidence_percent -
      m.entropy -
      0.2 * m.latency_ms -
      m.risk_score * 100
    );
  }

  const safestModel = [...chartData].sort((a, b) => a.risk_score - b.risk_score)[0];
  const highestConfidenceModel = [...chartData].sort(
    (a, b) => b.confidence_percent - a.confidence_percent
  )[0];
  const fastestSafeModel = [...chartData]
    .filter((m) => m.risk_score < SAFE_THRESHOLD)
    .sort((a, b) => a.latency_ms - b.latency_ms)[0];
  const balancedModel = [...chartData].sort(
    (a, b) => scoreModel(b, datasetType) - scoreModel(a, datasetType)
  )[0];
  const lowestEntropyModel = [...chartData].sort((a, b) => a.entropy - b.entropy)[0];
  const highestStabilityModel = [...chartData].sort(
    (a, b) => b.stability - a.stability
  )[0];

  function getBadges(model: string) {
    const badges: string[] = [];
    if (model === safestModel?.model) badges.push('🛡 Safest');
    if (model === balancedModel?.model) badges.push('⚖️ Balanced');
    if (model === highestConfidenceModel?.model) badges.push('🎯 Highest Accuracy');
    if (model === fastestSafeModel?.model) badges.push('⚡ Fastest Safe');
    return badges;
  }

  async function exportPdf() {
    try {
      setExporting(true);

      const response = await fetch(
        `http://localhost:8000/api/export/pdf/${id}`
      );

      if (!response.ok) throw new Error('PDF export failed');

      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const fileUri = `${FileSystem.documentDirectory}evaluation_${id}.pdf`;

        await FileSystem.writeAsStringAsync(
          fileUri,
          base64data.split(',')[1],
          {
            encoding: FileSystem.EncodingType.Base64,
          }
        );

        await Sharing.shareAsync(fileUri);

        Alert.alert('Success', 'PDF exported successfully!');
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('PDF export error:', error);
      Alert.alert('Error', 'Failed to export PDF');
    } finally {
      setExporting(false);
    }
  }

  const modelDropdownItems = [
    { label: 'All Models', value: 'ALL' },
    ...MODEL_ORDER.map((model) => ({
      label: model.replace('.pth', ''),
      value: model,
    })),
  ];

  const handleModelChange = (value: string | number) => {
    const modelValue = value as string;
    setSelectedModel(modelValue);
    setShowAllModels(modelValue === 'ALL');
  };

  const confidenceChartData = chartData.map((m) => ({
    model: m.model,
    value: m.confidence_percent,
  }));

  const latencyChartData = chartData.map((m) => ({
    model: m.model,
    value: m.latency_ms,
  }));

  const entropyChartData = chartData.map((m) => ({
    model: m.model,
    value: m.entropy,
  }));

  const stabilityChartData = chartData.map((m) => ({
    model: m.model,
    value: m.stability,
  }));

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Header onMenuPress={openDrawer} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={[styles.loadingText, { opacity: 0.6 }]}>
            Loading results...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!doc || !mnistData) {
    return (
      <ThemedView style={styles.container}>
        <Header onMenuPress={openDrawer} />
        <View style={styles.centerContainer}>
          <ThemedText style={[styles.errorText, { color: '#dc2626' }]}>
            Invalid result
          </ThemedText>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  const visibleModels = showAllModels
    ? chartData
    : chartData.filter((m) => m.model === selectedModel);

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
        {/* Title & Actions */}
        <View style={styles.section}>
          <ThemedText style={styles.title}>Evaluation Results</ThemedText>
          
          <View style={styles.actionButtons}>
            {hasCifar && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#8b5cf6' }]}
                onPress={() => router.push(`/compare/${id}` as any)}
              >
                <ThemedText style={styles.actionButtonText}>
                  Compare MNIST vs CIFAR
                </ThemedText>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: exporting ? colors.border : '#3b82f6',
                },
              ]}
              onPress={exportPdf}
              disabled={exporting}
            >
              <ThemedText style={styles.actionButtonText}>
                {exporting ? 'Exporting...' : 'Export PDF'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <ThemedText style={styles.sectionTitle}>Best Models</ThemedText>
          <View style={styles.summaryGrid}>
            <SummaryCard
              title="Safest"
              model={safestModel}
              colors={colors}
              icon="🛡"
            />
            <SummaryCard
              title="Balanced"
              model={balancedModel}
              colors={colors}
              icon="⚖️"
            />
            <SummaryCard
              title="Highest Accuracy"
              model={highestConfidenceModel}
              colors={colors}
              icon="🎯"
            />
            {fastestSafeModel && (
              <SummaryCard
                title="Fastest Safe"
                model={fastestSafeModel}
                colors={colors}
                icon="⚡"
              />
            )}
          </View>
        </View>

        {/* Model Selector */}
        <View style={styles.modelSelectorContainer}>
          <ThemedText style={styles.selectorLabel}>Select Model</ThemedText>
          <Dropdown
            value={selectedModel}
            items={modelDropdownItems}
            onValueChange={handleModelChange}
            placeholder="Select a model"
          />
        </View>

        {/* Charts Section - Only show when ALL models selected */}
        {selectedModel === 'ALL' && (
          <View style={styles.chartsSection}>
            <ThemedText style={styles.sectionTitle}>Performance Charts</ThemedText>

            <BarChart
              title="Confidence (%)"
              subtitle="How sure the model is about its prediction."
              data={confidenceChartData}
              bestModel={highestConfidenceModel?.model}
              unit="%"
            />

            <BarChart
              title="Latency (ms)"
              subtitle="Time taken to process one image."
              data={latencyChartData}
              bestModel={fastestSafeModel?.model || chartData[0]?.model}
              unit=" ms"
              lowIsBetter
            />

            <BarChart
              title="Prediction Uncertainty"
              subtitle="Measures how uncertain the model is."
              data={entropyChartData}
              bestModel={lowestEntropyModel?.model}
              lowIsBetter
            />

            <BarChart
              title="Prediction Stability"
              subtitle="Consistency of model outputs."
              data={stabilityChartData}
              bestModel={highestStabilityModel?.model}
            />
          </View>
        )}

        {/* Model Details Cards */}
        <View style={styles.modelsSection}>
          <ThemedText style={styles.sectionTitle}>Model Details</ThemedText>
          {visibleModels.map((model) => (
            <ModelCard
              key={model.model}
              model={model}
              badges={getBadges(model.model)}
              colors={colors}
            />
          ))}
        </View>

        {/* Confusion Matrices */}
        {mnistData && (
          <View style={styles.confusionSection}>
            <ThemedText style={styles.sectionTitle}>
              {selectedModel === 'ALL' ? 'Confusion Matrices' : 'Confusion Matrix'}
            </ThemedText>
            {visibleModels.map((model) => (
              <ConfusionMatrix
                key={model.model}
                model={model.model}
                matrix={mnistData[model.model]?.evaluation?.confusion_matrix || []}
                accuracy={model.confidence_percent}
                FAR={mnistData[model.model]?.evaluation?.FAR}
                FRR={mnistData[model.model]?.evaluation?.FRR}
                riskScore={model.risk_score}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

/* ================= COMPONENTS ================= */

function SummaryCard({
  title,
  model,
  colors,
  icon,
}: {
  title: string;
  model?: ChartItemWithRisk;
  colors: any;
  icon: string;
}) {
  if (!model) return null;

  return (
    <View
      style={[
        styles.summaryCard,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
        },
      ]}
    >
      <ThemedText style={styles.summaryIcon}>{icon}</ThemedText>
      <ThemedText style={[styles.summaryTitle, { opacity: 0.6 }]}>
        {title}
      </ThemedText>
      <ThemedText style={styles.summaryModel} numberOfLines={1}>
        {model.model.replace('.pth', '')}
      </ThemedText>
      <ThemedText style={[styles.summaryMetric, { opacity: 0.7 }]}>
        {model.confidence_percent.toFixed(2)}% accuracy
      </ThemedText>
    </View>
  );
}

function ModelCard({
  model,
  badges,
  colors,
}: {
  model: ChartItemWithRisk;
  badges: string[];
  colors: any;
}) {
  return (
    <View
      style={[
        styles.modelCard,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
        },
      ]}
    >
      <ThemedText style={styles.modelName}>{model.model}</ThemedText>

      {badges.length > 0 && (
        <View style={styles.badgesContainer}>
          {badges.map((badge) => (
            <View
              key={badge}
              style={[
                styles.badge,
                {
                  backgroundColor: colors.primary + '20',
                  borderColor: colors.primary,
                },
              ]}
            >
              <ThemedText style={[styles.badgeText, { color: colors.primary }]}>
                {badge}
              </ThemedText>
            </View>
          ))}
        </View>
      )}

      <MetricRow label="Accuracy" value={`${model.confidence_percent.toFixed(2)}%`} />
      <MetricRow label="Latency" value={`${model.latency_ms.toFixed(3)} ms`} />
      <MetricRow label="Entropy" value={model.entropy.toFixed(4)} />
      <MetricRow label="Stability" value={model.stability.toFixed(4)} />
      <MetricRow label="Risk Score" value={model.risk_score.toFixed(4)} />
      <MetricRow label="RAM Delta" value={`${model.ram_delta_mb.toFixed(2)} MB`} />
    </View>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricRow}>
      <ThemedText style={[styles.metricLabel, { opacity: 0.6 }]}>
        {label}
      </ThemedText>
      <ThemedText style={styles.metricValue}>{value}</ThemedText>
    </View>
  );
}

/* ================= MOCK DATA ================= */
function getMockResultDetail(): ResultDoc {
  const generateConfusionMatrix = () => {
    const matrix: number[][] = [];
    for (let i = 0; i < 10; i++) {
      const row: number[] = [];
      for (let j = 0; j < 10; j++) {
        if (i === j) {
          row.push(Math.floor(Math.random() * 300) + 200); // Correct predictions
        } else {
          row.push(Math.floor(Math.random() * 100)); // Misclassifications
        }
      }
      matrix.push(row);
    }
    return matrix;
  };

  return {
    data: {
      MNIST: {
        'baseline_mnist.pth': {
          confidence_percent: 20.30,
          latency_ms: 0.372,
          entropy: 2.18,
          stability: 0.54,
          ram_mb: 12.5,
          evaluation: {
            risk_score: 0.4636,
            confusion_matrix: generateConfusionMatrix(),
            FAR: 9.28,
            FRR: 83.44,
          },
        },
        'kd_mnist.pth': {
          confidence_percent: 19.58,
          latency_ms: 0.371,
          entropy: 2.18,
          stability: 0.48,
          ram_mb: 8.2,
          evaluation: {
            risk_score: 0.4642,
            confusion_matrix: generateConfusionMatrix(),
            FAR: 9.32,
            FRR: 83.42,
          },
        },
        'lrf_mnist.pth': {
          confidence_percent: 10.76,
          latency_ms: 0.314,
          entropy: 2.35,
          stability: 0.06,
          ram_mb: 6.8,
          evaluation: {
            risk_score: 0.4980,
            confusion_matrix: generateConfusionMatrix(),
            FAR: 9.85,
            FRR: 90.12,
          },
        },
        'pruned_mnist.pth': {
          confidence_percent: 20.29,
          latency_ms: 0.322,
          entropy: 2.18,
          stability: 0.54,
          ram_mb: 5.1,
          evaluation: {
            risk_score: 0.4638,
            confusion_matrix: generateConfusionMatrix(),
            FAR: 9.29,
            FRR: 83.43,
          },
        },
        'quantized_mnist.pth': {
          confidence_percent: 10.99,
          latency_ms: 0.302,
          entropy: 2.35,
          stability: 0.06,
          ram_mb: 4.2,
          evaluation: {
            risk_score: 0.5029,
            confusion_matrix: generateConfusionMatrix(),
            FAR: 9.90,
            FRR: 89.98,
          },
        },
        'ws_mnist.pth': {
          confidence_percent: 11.03,
          latency_ms: 0.314,
          entropy: 2.34,
          stability: 0.07,
          ram_mb: 7.5,
          evaluation: {
            risk_score: 0.4960,
            confusion_matrix: generateConfusionMatrix(),
            FAR: 9.82,
            FRR: 89.94,
          },
        },
      },
    },
    meta: {
      evaluation_type: 'DATASET',
      source: 'PREBUILT',
      dataset_type: 'MNIST_100',
      num_images: 100,
    },
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
  },
  backButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  summarySection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryGrid: {
    gap: 12,
  },
  summaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  summaryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryModel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryMetric: {
    fontSize: 12,
  },
  modelSelectorContainer: {
    marginBottom: 24,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  chartsSection: {
    marginBottom: 32,
  },
  modelsSection: {
    marginBottom: 24,
  },
  modelCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  modelName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  confusionSection: {
    marginTop: 24,
  },
});