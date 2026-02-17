import React, { useState, useEffect, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedText } from '@/components/ui/ThemedText';
import { Header } from '@/components/layout/Header';
import { Drawer } from '@/components/layout/Drawer';
import { useTheme } from '@/hooks/useTheme';
import { fetchResult } from "@/lib/api";

/* ================= CONSTANTS ================= */

const MODEL_ORDER = [
  'baseline_mnist.pth',
  'kd_mnist.pth',
  'lrf_mnist.pth',
  'pruned_mnist.pth',
  'quantized_mnist.pth',
  'ws_mnist.pth',
];

const MODEL_LABELS: Record<string, string> = {
  baseline: 'Baseline',
  kd: 'Knowledge Distillation',
  lrf: 'Low-Rank Factorization',
  pruned: 'Pruned',
  quantized: 'Quantized',
  ws: 'Weight Sharing',
};

/* ================= TYPES ================= */

type ResultDoc = {
  data: {
    MNIST?: Record<string, any>;
    CIFAR?: Record<string, any>;
  };
};

type Metrics = {
  conf: number;
  lat: number;
  risk: number;
};

type CompareRow = {
  key: string;
  label: string;
  mnist: Metrics;
  cifar: Metrics;
  delta: Metrics;
};

export default function CompareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, toggleTheme, isDark } = useTheme();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const [doc, setDoc] = useState<ResultDoc | null>(null);
  const [loading, setLoading] = useState(true);

  const openDrawer = () => setDrawerVisible(true);
  const closeDrawer = () => setDrawerVisible(false);

  /* ================= FETCH DATA ================= */
    useEffect(() => {
    if (!id) return;

    setLoading(true);

    fetchResult(id)
        .then((data) => setDoc(data))
        .catch((error) => {
        console.error("Error fetching comparison data:", error);
        setDoc(getMockComparisonData());
        })
        .finally(() => setLoading(false));
    }, [id]);

  /* ================= HELPERS ================= */
  const archKey = (m: string) => m.split('_')[0];

  const getDeltaColor = (v: number, inverse = false) => {
    if (Math.abs(v) < 0.001) return '#6b7280';
    const bad = inverse ? v > 0 : v < 0;
    return bad ? '#dc2626' : '#16a34a';
  };

  const getDeltaIcon = (v: number, inverse = false) => {
    if (Math.abs(v) < 0.001) return '➖';
    const bad = inverse ? v > 0 : v < 0;
    return bad ? '📉' : '📈';
  };

  /* ================= ROWS ================= */
  const rows = useMemo<CompareRow[]>(() => {
    if (!doc?.data?.MNIST || !doc?.data?.CIFAR) return [];

    return MODEL_ORDER.map((m) => {
      const c = m.replace('mnist', 'cifar');
      const mn = doc.data.MNIST![m];
      const cf = doc.data.CIFAR![c];
      if (!mn || !cf) return null;

      return {
        key: archKey(m),
        label: MODEL_LABELS[archKey(m)],
        mnist: {
          conf: mn.confidence_percent ?? mn.confidence_mean ?? 0,
          lat: mn.latency_ms ?? mn.latency_mean ?? 0,
          risk: mn.evaluation?.risk_score ?? 1,
        },
        cifar: {
          conf: cf.confidence_percent ?? cf.confidence_mean ?? 0,
          lat: cf.latency_ms ?? cf.latency_mean ?? 0,
          risk: cf.evaluation?.risk_score ?? 1,
        },
        delta: {
          conf: (cf.confidence_percent ?? 0) - (mn.confidence_percent ?? 0),
          lat: (cf.latency_ms ?? 0) - (mn.latency_ms ?? 0),
          risk: (cf.evaluation?.risk_score ?? 0) - (mn.evaluation?.risk_score ?? 0),
        },
      };
    }).filter(Boolean) as CompareRow[];
  }, [doc]);

  /* ================= DATASET SUMMARY ================= */
  const datasetSummary = useMemo(() => {
    if (!rows.length) {
      return {
        mnist: { conf: 0, lat: 0, risk: 0 },
        cifar: { conf: 0, lat: 0, risk: 0 },
        winner: 'MNIST',
      };
    }

    const avg = (n: number[]) =>
      n.length ? n.reduce((a, b) => a + b, 0) / n.length : 0;

    const mnist = {
      conf: avg(rows.map((r) => r.mnist.conf)),
      lat: avg(rows.map((r) => r.mnist.lat)),
      risk: avg(rows.map((r) => r.mnist.risk)),
    };

    const cifar = {
      conf: avg(rows.map((r) => r.cifar.conf)),
      lat: avg(rows.map((r) => r.cifar.lat)),
      risk: avg(rows.map((r) => r.cifar.risk)),
    };

    const winner =
      mnist.conf >= cifar.conf && mnist.risk <= cifar.risk ? 'MNIST' : 'CIFAR';

    return { mnist, cifar, winner };
  }, [rows]);

  const winnerMetrics =
    datasetSummary.winner === 'MNIST' ? datasetSummary.mnist : datasetSummary.cifar;

  /* ================= RENDER ================= */
  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Header onMenuPress={openDrawer} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={[styles.loadingText, { opacity: 0.6 }]}>
            Loading comparison...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!doc?.data?.MNIST || !doc?.data?.CIFAR) {
    return (
      <ThemedView style={styles.container}>
        <Header onMenuPress={openDrawer} />
        <View style={styles.centerContainer}>
          <ThemedText style={[styles.errorText, { color: '#dc2626' }]}>
            CIFAR data not available
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

  return (
    <ThemedView style={styles.container}>
      <Header onMenuPress={openDrawer} />
      <Drawer visible={drawerVisible} onClose={closeDrawer} onThemeToggle={toggleTheme} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>MNIST vs CIFAR</ThemedText>
          <TouchableOpacity
            style={[styles.backButtonHeader, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onPress={() => router.push(`/results/${id}` as any)}
          >
            <ThemedText style={styles.backButtonHeaderText}>← Back</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Winner Card */}
        <View
          style={[
            styles.winnerCard,
            {
              backgroundColor: datasetSummary.winner === 'MNIST' ? '#d1fae5' : '#dbeafe',
              borderColor: datasetSummary.winner === 'MNIST' ? '#34d399' : '#60a5fa',
            },
          ]}
        >
          <ThemedText style={styles.winnerTitle}>🏆 Dataset Winner</ThemedText>
          <ThemedText style={styles.winnerName}>{datasetSummary.winner}</ThemedText>
          <View style={styles.winnerMetrics}>
            <ThemedText style={styles.winnerMetricText}>
              Accuracy: {winnerMetrics.conf.toFixed(2)}%
            </ThemedText>
            <ThemedText style={styles.winnerMetricText}>
              Latency: {winnerMetrics.lat.toFixed(2)} ms
            </ThemedText>
            <ThemedText style={styles.winnerMetricText}>
              Risk: {winnerMetrics.risk.toFixed(4)}
            </ThemedText>
          </View>
        </View>

        {/* Comparison Cards */}
        <View style={styles.comparisonsContainer}>
          {rows.map((row) => (
            <ComparisonCard
              key={row.key}
              row={row}
              colors={colors}
              isDark={isDark}
              getDeltaColor={getDeltaColor}
              getDeltaIcon={getDeltaIcon}
            />
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

/* ================= COMPONENTS ================= */

function ComparisonCard({
  row,
  colors,
  isDark,
  getDeltaColor,
  getDeltaIcon,
}: {
  row: CompareRow;
  colors: any;
  isDark: boolean;
  getDeltaColor: (v: number, inverse?: boolean) => string;
  getDeltaIcon: (v: number, inverse?: boolean) => string;
}) {
  return (
    <View style={[styles.comparisonCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      {/* Header */}
      <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
        <ThemedText style={styles.cardTitle}>{row.label}</ThemedText>
      </View>

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        {/* MNIST Column */}
        <MetricCard title="MNIST" data={row.mnist} color="#10b981" colors={colors} isDark={isDark} />

        {/* CIFAR Column */}
        <MetricCard title="CIFAR" data={row.cifar} color="#3b82f6" colors={colors} isDark={isDark} />

        {/* Delta Column */}
        <DeltaCard delta={row.delta} getDeltaColor={getDeltaColor} getDeltaIcon={getDeltaIcon} colors={colors} />
      </View>
    </View>
  );
}

function MetricCard({
  title,
  data,
  color,
  colors,
  isDark,
}: {
  title: string;
  data: Metrics;
  color: string;
  colors: any;
  isDark: boolean;
}) {
  return (
    <View
      style={[
        styles.metricCard,
        {
          backgroundColor: isDark ? colors.background : '#f9fafb',
          borderColor: color + '40',
        },
      ]}
    >
      <ThemedText style={styles.metricCardTitle}>{title}</ThemedText>

      <MetricBar label="Accuracy" value={data.conf} max={100} color={color} colors={colors} />
      <MetricBar label="Latency" value={data.lat} max={1} color={color} colors={colors} />
      <MetricBar label="Risk" value={data.risk} max={1} color={color} colors={colors} />
    </View>
  );
}

function MetricBar({
  label,
  value,
  max,
  color,
  colors,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  colors: any;
}) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <View style={styles.metricBarContainer}>
      <View style={styles.metricBarHeader}>
        <ThemedText style={styles.metricBarLabel}>{label}</ThemedText>
        <ThemedText style={styles.metricBarValue}>{value.toFixed(2)}</ThemedText>
      </View>
      <View style={[styles.metricBarTrack, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.metricBarFill,
            {
              width: `${percentage}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

function DeltaCard({
  delta,
  getDeltaColor,
  getDeltaIcon,
  colors,
}: {
  delta: Metrics;
  getDeltaColor: (v: number, inverse?: boolean) => string;
  getDeltaIcon: (v: number, inverse?: boolean) => string;
  colors: any;
}) {
  return (
    <View style={[styles.deltaCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <ThemedText style={styles.deltaCardTitle}>Δ CIFAR − MNIST</ThemedText>

      <DeltaRow label="Accuracy" value={delta.conf} inverse={false} getDeltaColor={getDeltaColor} getDeltaIcon={getDeltaIcon} />
      <DeltaRow label="Latency" value={delta.lat} inverse={true} getDeltaColor={getDeltaColor} getDeltaIcon={getDeltaIcon} />
      <DeltaRow label="Risk" value={delta.risk} inverse={true} getDeltaColor={getDeltaColor} getDeltaIcon={getDeltaIcon} />
    </View>
  );
}

function DeltaRow({
  label,
  value,
  inverse,
  getDeltaColor,
  getDeltaIcon,
}: {
  label: string;
  value: number;
  inverse: boolean;
  getDeltaColor: (v: number, inverse?: boolean) => string;
  getDeltaIcon: (v: number, inverse?: boolean) => string;
}) {
  const color = getDeltaColor(value, inverse);
  const icon = getDeltaIcon(value, inverse);

  return (
    <View style={styles.deltaRow}>
      <ThemedText style={[styles.deltaLabel, { color }]}>
        {icon} {label}
      </ThemedText>
      <ThemedText style={[styles.deltaValue, { color }]}>{value.toFixed(3)}</ThemedText>
    </View>
  );
}

/* ================= MOCK DATA ================= */
function getMockComparisonData(): ResultDoc {
  return {
    data: {
      MNIST: {
        'baseline_mnist.pth': {
          confidence_percent: 20.30,
          latency_ms: 0.37,
          evaluation: { risk_score: 0.46 },
        },
        'kd_mnist.pth': {
          confidence_percent: 19.58,
          latency_ms: 0.37,
          evaluation: { risk_score: 0.46 },
        },
        'lrf_mnist.pth': {
          confidence_percent: 10.76,
          latency_ms: 0.31,
          evaluation: { risk_score: 0.50 },
        },
        'pruned_mnist.pth': {
          confidence_percent: 20.29,
          latency_ms: 0.32,
          evaluation: { risk_score: 0.46 },
        },
        'quantized_mnist.pth': {
          confidence_percent: 10.99,
          latency_ms: 0.30,
          evaluation: { risk_score: 0.50 },
        },
        'ws_mnist.pth': {
          confidence_percent: 11.03,
          latency_ms: 0.31,
          evaluation: { risk_score: 0.50 },
        },
      },
      CIFAR: {
        'baseline_cifar.pth': {
          confidence_percent: 93.90,
          latency_ms: 0.54,
          evaluation: { risk_score: 0.50 },
        },
        'kd_cifar.pth': {
          confidence_percent: 81.42,
          latency_ms: 0.44,
          evaluation: { risk_score: 0.50 },
        },
        'lrf_cifar.pth': {
          confidence_percent: 65.23,
          latency_ms: 0.38,
          evaluation: { risk_score: 0.52 },
        },
        'pruned_cifar.pth': {
          confidence_percent: 88.45,
          latency_ms: 0.41,
          evaluation: { risk_score: 0.48 },
        },
        'quantized_cifar.pth': {
          confidence_percent: 72.18,
          latency_ms: 0.35,
          evaluation: { risk_score: 0.51 },
        },
        'ws_cifar.pth': {
          confidence_percent: 69.87,
          latency_ms: 0.39,
          evaluation: { risk_score: 0.49 },
        },
      },
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
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 16,
  },
  backButtonHeader: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  backButtonHeaderText: {
    fontSize: 15,
    fontWeight: '600',
  },
  winnerCard: {
    borderRadius: 24,
    borderWidth: 4,
    padding: 24,
    marginBottom: 32,
  },
  winnerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#000',
  },
  winnerName: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 12,
    color: '#000',
  },
  winnerMetrics: {
    gap: 2,
  },
  winnerMetricText: {
    fontSize: 13,
    color: '#000',
  },
  comparisonsContainer: {
    gap: 24,
  },
  comparisonCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    padding: 20,
    borderBottomWidth: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  metricsGrid: {
    padding: 20,
    gap: 16,
  },
  metricCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
  },
  metricCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  metricBarContainer: {
    marginBottom: 12,
  },
  metricBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metricBarLabel: {
    fontSize: 13,
  },
  metricBarValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  metricBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  deltaCard: {
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: 16,
  },
  deltaCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  deltaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  deltaLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  deltaValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});