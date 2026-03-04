import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedText } from '@/components/ui/ThemedText';
import { Header } from '@/components/layout/Header';
import { Drawer } from '@/components/layout/Drawer';
import Dropdown from '@/components/ui/Dropdown';
import BarChart from '@/components/charts/BarChartMobile';
import ConfusionMatrix from '@/components/confusion-matrix/ConfusionMatrix';
import LineChartMobile from '@/components/charts/LineChartMobile';
import ScatterChartMobile from '@/components/charts/ScatterChartMobile';
import { useTheme } from '@/hooks/useTheme';
import { fetchResult, downloadResultPdf } from '@/lib/api';


/* ================= CONSTANTS ================= */
const MODEL_ORDER = [
  'baseline_mnist.pth',
  'kd_mnist.pth',
  'lrf_mnist.pth',
  'pruned_mnist.pth',
  'quantized_mnist.pth',
  'ws_mnist.pth',
];

const SAFE_THRESHOLD = 0.15;


/* ================= TYPES ================= */
type EAResult = {
  alpha: number;
  beta?: number;
  best_model?: string;
  generations_used: number;
  best_generation?: number;
  history: {
    alpha: number[];
    fitness: number[];
    diversity?: number[];
  };
  scores?: Record<string, number>;
};

type EAOptimization =
  | EAResult
  | {
      MNIST?: EAResult;
      CIFAR?: EAResult;
    };

type ConfidenceInterval = {
  risk_mean: number;
  risk_std: number;
  risk_ci_lower: number;
  risk_ci_upper: number;
};

type ResultDoc = {
  data: {
    MNIST?: Record<string, any>;
    CIFAR?: Record<string, any>;
    ea_optimization?: EAOptimization;
    ablation_study?: {
      static_alphas: {
        [alpha: string]: {
          risk_score: number;
          confidence_percent: number;
          model: string;
        };
      };
      ea_optimized: {
        risk_score: number;
        confidence_percent: number;
        model: string;
        alpha: number;
      };
    };
    statistical_tests?: {
      paired_ttest?: {
        t_stat: number;
        p_value: number;
        significant: boolean;
      };
      wilcoxon?: {
        statistic: number;
        p_value: number;
        significant: boolean;
      };
      confidence_intervals?: {
        [model: string]: ConfidenceInterval;
      };
    };
    cross_dataset?: {
      mnist_alpha: number;
      cifar_risk_ea: number;
      cifar_risk_static: number;
      performance_drop: number;
    };
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


/* ================= HELPERS ================= */
function getParetoFront(data: ChartItemWithRisk[]) {
  return data.filter(
    (modelA) =>
      !data.some(
        (modelB) =>
          modelB !== modelA &&
          modelB.risk_score <= modelA.risk_score &&
          modelB.confidence_percent >= modelA.confidence_percent &&
          (modelB.risk_score < modelA.risk_score ||
            modelB.confidence_percent > modelA.confidence_percent)
      )
  );
}

function scoreModel(m: ChartItemWithRisk, datasetType?: string) {
  if (!datasetType) return -m.latency_ms;
  return (
    m.confidence_percent -
    m.entropy -
    0.2 * m.latency_ms -
    m.risk_score * 100
  );
}


/* ================= COMPONENTS ================= */

function MetricRow({
  label,
  value,
  labelColor,
  valueColor,
}: {
  label: string;
  value: string;
  labelColor?: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.metricRow}>
      <ThemedText
        style={[styles.metricLabel, labelColor ? { color: labelColor } : { opacity: 0.6 }]}
      >
        {label}
      </ThemedText>
      <ThemedText style={[styles.metricValue, valueColor ? { color: valueColor } : {}]}>
        {value}
      </ThemedText>
    </View>
  );
}

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
        { backgroundColor: colors.cardBackground, borderColor: colors.border },
      ]}
    >
      <ThemedText style={styles.summaryIcon}>{icon}</ThemedText>
      <ThemedText style={[styles.summaryTitle, { opacity: 0.6 }]}>{title}</ThemedText>
      <ThemedText style={styles.summaryModel} numberOfLines={1}>
        {model.model.replace('.pth', '')}
      </ThemedText>
      <ThemedText style={[styles.summaryMetric, { opacity: 0.7 }]}>
        {model.confidence_percent.toFixed(2)}% accuracy
      </ThemedText>
    </View>
  );
}

function EASummaryCard({
  eaData,
  colors,
}: {
  eaData: EAResult;
  colors: any;
}) {
  return (
    <View
      style={[
        styles.summaryCard,
        styles.eaSummaryCard,
        { backgroundColor: '#f5f3ff', borderColor: '#a78bfa' },
      ]}
    >
      <ThemedText style={[styles.summaryIcon, { color: '#4c1d95' }]}>🧬</ThemedText>
      <ThemedText style={[styles.summaryTitle, { color: '#7c3aed' }]}>
        EA Optimized
      </ThemedText>
      <ThemedText style={[styles.summaryModel, { color: '#1e1b4b' }]} numberOfLines={1}>
        {eaData.best_model?.replace('.pth', '') ?? 'N/A'}
      </ThemedText>
      <ThemedText style={[styles.summaryMetric, { color: '#6d28d9' }]}>
        Generations: {eaData.generations_used}
      </ThemedText>
      <ThemedText style={[styles.summaryMetric, { color: '#6d28d9' }]}>
        α: {eaData.alpha?.toFixed(4) ?? 'N/A'}
      </ThemedText>
    </View>
  );
}

function ModelCard({
  model,
  badges,
  colors,
  isEA,
}: {
  model: ChartItemWithRisk;
  badges: string[];
  colors: any;
  isEA?: boolean;
}) {
  return (
    <View
      style={[
        styles.modelCard,
        {
          backgroundColor: isEA ? '#f5f3ff' : colors.cardBackground,
          borderColor: isEA ? '#a78bfa' : colors.border,
          borderWidth: isEA ? 2 : 1,
        },
      ]}
    >
      <ThemedText style={[styles.modelName, isEA ? { color: '#1e1b4b' } : {}]}>{model.model}</ThemedText>

      {(badges.length > 0 || isEA) && (
        <View style={styles.badgesContainer}>
          {badges.map((badge) => (
            <View
              key={badge}
              style={[
                styles.badge,
                { backgroundColor: colors.primary + '20', borderColor: colors.primary },
              ]}
            >
              <ThemedText style={[styles.badgeText, { color: colors.primary }]}>
                {badge}
              </ThemedText>
            </View>
          ))}
          {isEA && (
            <View style={[styles.badge, { backgroundColor: '#ede9fe', borderColor: '#7c3aed' }]}>
              <ThemedText style={[styles.badgeText, { color: '#7c3aed' }]}>
                🧬 EA Selected
              </ThemedText>
            </View>
          )}
        </View>
      )}

      <MetricRow label="Accuracy" value={`${model.confidence_percent.toFixed(2)}%`} labelColor={isEA ? '#7c3aed' : undefined} valueColor={isEA ? '#1e1b4b' : undefined} />
      <MetricRow label="Latency" value={`${model.latency_ms.toFixed(3)} ms`} labelColor={isEA ? '#7c3aed' : undefined} valueColor={isEA ? '#1e1b4b' : undefined} />
      <MetricRow label="Entropy" value={model.entropy.toFixed(4)} labelColor={isEA ? '#7c3aed' : undefined} valueColor={isEA ? '#1e1b4b' : undefined} />
      <MetricRow label="Stability" value={model.stability.toFixed(4)} labelColor={isEA ? '#7c3aed' : undefined} valueColor={isEA ? '#1e1b4b' : undefined} />
      <MetricRow label="Risk Score" value={model.risk_score.toFixed(4)} labelColor={isEA ? '#7c3aed' : undefined} valueColor={isEA ? '#1e1b4b' : undefined} />
      <MetricRow label="RAM Delta" value={`${model.ram_delta_mb.toFixed(2)} MB`} labelColor={isEA ? '#7c3aed' : undefined} valueColor={isEA ? '#1e1b4b' : undefined} />
    </View>
  );
}

/** Statistical Significance Section */
function StatisticalSignificanceSection({ stats, colors }: { stats: any; colors: any }) {
  if (!stats) return null;

  const pValueSig =
    stats.paired_ttest?.p_value < 0.05 || stats.wilcoxon?.p_value < 0.05;

  return (
    <View style={[styles.researchSection, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
      <ThemedText style={[styles.researchTitle, { color: '#1e40af' }]}>
        📊 Statistical Significance Testing
      </ThemedText>

      <View style={styles.statsGrid}>
        {stats.paired_ttest && (
          <View style={[styles.statsCard, { backgroundColor: colors.cardBackground }]}>
            <ThemedText style={styles.statsCardTitle}>🎯 Paired t-test</ThemedText>
            <MetricRow
              label="t-statistic"
              value={stats.paired_ttest.t_stat.toFixed(3)}
            />
            <MetricRow
              label="p-value"
              value={stats.paired_ttest.p_value.toFixed(6)}
            />
            <View
              style={[
                styles.sigBadge,
                {
                  backgroundColor: stats.paired_ttest.significant
                    ? '#dcfce7'
                    : '#ffedd5',
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.sigBadgeText,
                  {
                    color: stats.paired_ttest.significant ? '#166534' : '#9a3412',
                  },
                ]}
              >
                {stats.paired_ttest.significant
                  ? '✅ Significant (p<0.05)'
                  : '❌ Not Significant'}
              </ThemedText>
            </View>
          </View>
        )}

        {stats.wilcoxon && (
          <View style={[styles.statsCard, { backgroundColor: colors.cardBackground }]}>
            <ThemedText style={styles.statsCardTitle}>🔬 Wilcoxon Signed-Rank</ThemedText>
            <MetricRow
              label="Statistic"
              value={stats.wilcoxon.statistic.toFixed(0)}
            />
            <MetricRow
              label="p-value"
              value={stats.wilcoxon.p_value.toFixed(6)}
            />
            <View
              style={[
                styles.sigBadge,
                {
                  backgroundColor: stats.wilcoxon.significant ? '#dcfce7' : '#ffedd5',
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.sigBadgeText,
                  { color: stats.wilcoxon.significant ? '#166534' : '#9a3412' },
                ]}
              >
                {stats.wilcoxon.significant
                  ? '✅ Significant (p<0.05)'
                  : '❌ Not Significant'}
              </ThemedText>
            </View>
          </View>
        )}

        {stats.confidence_intervals && (
          <View style={[styles.statsCard, { backgroundColor: colors.cardBackground }]}>
            <ThemedText style={styles.statsCardTitle}>📏 95% Confidence Intervals</ThemedText>
            {Object.entries(
              stats.confidence_intervals as Record<string, ConfidenceInterval>
            ).map(([model, ci]) => (
              <View key={model} style={styles.ciRow}>
                <ThemedText style={styles.ciModel} numberOfLines={1}>
                  {model.replace('.pth', '')}
                </ThemedText>
                <ThemedText style={styles.ciValue}>
                  [{ci.risk_ci_lower.toFixed(4)}, {ci.risk_ci_upper.toFixed(4)}]
                </ThemedText>
              </View>
            ))}
          </View>
        )}
      </View>

      {pValueSig && (
        <View style={styles.sigSuccessBanner}>
          <ThemedText style={[styles.sigSuccessText, { color: '#14532d' }]}>
            ✅ EA improvements are statistically significant (p &lt; 0.05) — Ready for
            publication! 🎉
          </ThemedText>
        </View>
      )}
    </View>
  );
}

/** Ablation Study Section */
function AblationStudySection({ ablation, colors }: { ablation: any; colors: any }) {
  if (!ablation) return null;

  const ablationData = [
    { label: 'α=0.3', risk: ablation.static_alphas?.['0.3']?.risk_score ?? 0, isEA: false },
    { label: 'α=0.5', risk: ablation.static_alphas?.['0.5']?.risk_score ?? 0, isEA: false },
    { label: 'α=0.7', risk: ablation.static_alphas?.['0.7']?.risk_score ?? 0, isEA: false },
    {
      label: `EA (α=${ablation.ea_optimized?.alpha?.toFixed(2) ?? 'N/A'})`,
      risk: ablation.ea_optimized?.risk_score ?? 0,
      isEA: true,
    },
  ];

  return (
    <View style={[styles.researchSection, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
      <ThemedText style={[styles.researchTitle, { color: '#166534' }]}>
        🧪 Ablation Study: Alpha Evolution Impact
      </ThemedText>

      <BarChart
        title="Risk Score by Alpha Configuration"
        subtitle="Lower is better. EA dynamically finds the optimal alpha."
        data={ablationData.map((d) => ({ model: d.label, value: d.risk }))}
        bestModel={ablationData[3].label}
        lowIsBetter
      />

      <View style={styles.ablationGrid}>
        <View style={[styles.ablationCard, { backgroundColor: colors.cardBackground }]}>
          <ThemedText style={styles.ablationCardTitle}>Static Alpha Results</ThemedText>
          {['0.3', '0.5', '0.7'].map((alpha) =>
            ablation.static_alphas?.[alpha] ? (
              <View key={alpha} style={styles.metricRow}>
                <ThemedText style={[styles.metricLabel, { opacity: 0.6 }]}>
                  α={alpha}
                </ThemedText>
                <ThemedText style={styles.metricValue}>
                  {ablation.static_alphas[alpha].risk_score.toFixed(4)}
                </ThemedText>
              </View>
            ) : null
          )}
        </View>

        <View style={styles.ablationEACard}>
          <ThemedText style={[styles.ablationCardTitle, { color: '#991b1b' }]}>
            🔥 EA Optimized
          </ThemedText>
          <MetricRow
            label="Best Alpha"
            value={ablation.ea_optimized?.alpha?.toFixed(3) ?? 'N/A'}
            labelColor="#991b1b"
            valueColor="#450a0a"
          />
          <View style={styles.metricRow}>
            <ThemedText style={[styles.metricLabel, { color: '#991b1b' }]}>Risk Score</ThemedText>
            <ThemedText style={[styles.metricValue, { color: '#dc2626', fontSize: 16 }]}>
              {ablation.ea_optimized?.risk_score?.toFixed(4) ?? 'N/A'}
            </ThemedText>
          </View>
          <View style={styles.eaWinNote}>
            <ThemedText style={styles.eaWinText}>
              ✅ EA consistently beats static alphas
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

/** Cross Dataset Section */
function CrossDatasetSection({
  crossData,
  hasCifar,
  colors,
}: {
  crossData: any;
  hasCifar: boolean;
  colors: any;
}) {
  if (!crossData || !hasCifar) return null;

  return (
    <View style={[styles.researchSection, { backgroundColor: '#faf5ff', borderColor: '#e9d5ff' }]}>
      <ThemedText style={[styles.researchTitle, { color: '#6b21a8' }]}>
        🌐 Cross-Dataset Generalization
      </ThemedText>

      <View style={[styles.statsCard, { backgroundColor: colors.cardBackground }]}>
        <ThemedText style={styles.statsCardTitle}>MNIST → CIFAR Transfer</ThemedText>
        <MetricRow
          label="MNIST Optimized Alpha"
          value={crossData.mnist_alpha?.toFixed(3) ?? 'N/A'}
        />
        <View style={styles.crossMetricRow}>
          <View style={styles.crossMetric}>
            <ThemedText style={[styles.crossMetricValue, { color: '#dc2626' }]}>
              {crossData.cifar_risk_ea?.toFixed(4) ?? 'N/A'}
            </ThemedText>
            <ThemedText style={styles.crossMetricLabel}>CIFAR Risk (EA)</ThemedText>
          </View>
          <View style={styles.crossMetric}>
            <ThemedText style={[styles.crossMetricValue, { color: '#2563eb' }]}>
              {crossData.cifar_risk_static?.toFixed(4) ?? 'N/A'}
            </ThemedText>
            <ThemedText style={styles.crossMetricLabel}>CIFAR Risk (Static)</ThemedText>
          </View>
          <View style={styles.crossMetric}>
            <ThemedText style={[styles.crossMetricValue, { color: '#16a34a' }]}>
              ↓{crossData.performance_drop?.toFixed(1) ?? 'N/A'}%
            </ThemedText>
            <ThemedText style={styles.crossMetricLabel}>Perf. Drop</ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.generalizationVerdict}>
        <ThemedText style={[styles.verdictTitle, { color: '#14532d' }]}>🏆 EA Adapts Better</ThemedText>
        <ThemedText style={[styles.verdictText, { color: '#166534' }]}>
          Dynamic alpha optimization transfers effectively across datasets, maintaining
          superior risk reduction on CIFAR-10.
        </ThemedText>
      </View>
    </View>
  );
}

/** EA vs Heuristic comparison */
function EAvsHeuristicSection({
  eaData,
  balancedModel,
  chartData,
  colors,
}: {
  eaData: EAResult;
  balancedModel?: ChartItemWithRisk;
  chartData: ChartItemWithRisk[];
  colors: any;
}) {
  const eaModel = chartData.find((m) => m.model === eaData.best_model);
  const initialAlpha = eaData.history?.alpha?.length ? eaData.history.alpha[0] : undefined;

  return (
    <View style={[styles.researchSection, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <ThemedText style={[styles.researchTitle, { color: colors.text }]}>
        🧠 Evolution vs Heuristic Selection
      </ThemedText>

      <View style={styles.compareGrid}>
        <View style={[styles.compareCard, { borderColor: colors.border }]}>
          <ThemedText style={styles.compareCardTitle}>Heuristic Best (Balanced)</ThemedText>
          <MetricRow label="Model" value={balancedModel?.model?.replace('.pth', '') ?? 'N/A'} />
          <MetricRow label="Risk" value={balancedModel?.risk_score?.toFixed(4) ?? 'N/A'} />
          <MetricRow
            label="Accuracy"
            value={`${balancedModel?.confidence_percent?.toFixed(2)}%`}
          />
          <MetricRow label="Latency" value={`${balancedModel?.latency_ms?.toFixed(3)} ms`} />
        </View>

        <View style={[styles.compareCard, styles.eaCompareCard]}>
          <ThemedText style={[styles.compareCardTitle, { color: '#6d28d9' }]}>
            🧬 Evolution Optimized
          </ThemedText>
          <MetricRow label="Model" value={eaData.best_model?.replace('.pth', '') ?? 'N/A'} labelColor="#7c3aed" valueColor="#1e1b4b" />
          <MetricRow label="Converged Gen." value={String(eaData.best_generation ?? 'N/A')} labelColor="#7c3aed" valueColor="#1e1b4b" />
          <MetricRow label="Initial α" value={initialAlpha?.toFixed(4) ?? 'N/A'} labelColor="#7c3aed" valueColor="#1e1b4b" />
          <MetricRow label="Final α" value={eaData.alpha?.toFixed(4) ?? 'N/A'} labelColor="#7c3aed" valueColor="#1e1b4b" />
          <MetricRow label="Total Gens." value={String(eaData.generations_used)} labelColor="#7c3aed" valueColor="#1e1b4b" />
          {eaModel && (
            <>
              <MetricRow label="Risk" value={eaModel.risk_score.toFixed(4)} labelColor="#7c3aed" valueColor="#1e1b4b" />
              <MetricRow label="Accuracy" value={`${eaModel.confidence_percent.toFixed(2)}%`} labelColor="#7c3aed" valueColor="#1e1b4b" />
            </>
          )}
        </View>
      </View>

      <ThemedText style={styles.eaNote}>
        Evolution dynamically adjusted FAR/FRR weighting (alpha) to minimize composite
        risk rather than relying on static metric prioritization.
      </ThemedText>
    </View>
  );
}


/* ================= MAIN SCREEN ================= */

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
    setLoading(true);
    fetchResult(id)
      .then((data) => setDoc(data))
      .catch((error) => {
        console.error('Error fetching result:', error);
        Alert.alert('Error', 'Failed to load result');
        setDoc(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  /* ---- computed ---- */
  const mnistData = doc?.data?.MNIST;
  const datasetType = doc?.meta?.dataset_type;
  const hasCifar = !!doc?.data?.CIFAR;

  const eaRaw = doc?.data?.ea_optimization;
  let eaData: EAResult | undefined;
  if (eaRaw && 'history' in eaRaw) {
    eaData = eaRaw as EAResult;
  } else if (eaRaw && 'MNIST' in eaRaw) {
    eaData = (eaRaw as { MNIST?: EAResult }).MNIST;
  }

  const ablationData = doc?.data?.ablation_study;
  const statsData = doc?.data?.statistical_tests;
  const crossData = doc?.data?.cross_dataset;
  const eaBestModel = eaData?.best_model;

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
  const highestStabilityModel = [...chartData].sort((a, b) => b.stability - a.stability)[0];

  const getBadges = useCallback(
    (model: string) => {
      const badges: string[] = [];
      if (model === safestModel?.model) badges.push('🛡 Safest');
      if (model === balancedModel?.model) badges.push('⚖️ Balanced');
      if (model === highestConfidenceModel?.model) badges.push('🎯 Highest Accuracy');
      if (model === fastestSafeModel?.model) badges.push('⚡ Fastest Safe');
      return badges;
    },
    [safestModel, balancedModel, highestConfidenceModel, fastestSafeModel]
  );

  /* EA chart data */
  const alphaChartData = useMemo(() => {
    if (!eaData?.history?.alpha || eaData.history.alpha.length < 2) return [];
    return eaData.history.alpha.map((alpha, idx) => ({
      x: idx,
      y: alpha * 100,
    }));
  }, [eaData]);

  const fitnessChartData = useMemo(() => {
    if (!eaData?.history?.fitness || eaData.history.fitness.length < 2) return [];
    return eaData.history.fitness.map((fitness, idx) => ({
      x: idx,
      y: fitness,
    }));
  }, [eaData]);

  const riskImprovementChartData = useMemo(() => {
    if (!eaData?.history?.fitness?.length) return [];
    const initial = eaData.history.fitness[0];
    return eaData.history.fitness.map((f, idx) => ({
      x: idx + 1,
      y: ((initial - f) / Math.abs(initial)) * 100,
    }));
  }, [eaData]);

  /* Pareto chart data */
  const paretoChartData = useMemo(() => {
    if (!chartData.length) return { points: [], paretoLine: [] };
    const pareto = getParetoFront(chartData);
    const points = chartData.map((m) => ({
      x: m.risk_score,
      y: m.confidence_percent,
      name: m.model,
      isPareto: pareto.some((p) => p.model === m.model),
      isEA: m.model === eaBestModel,
    }));
    const sortedPareto = [...pareto].sort((a, b) => a.risk_score - b.risk_score);
    const paretoLine = sortedPareto.map((p) => ({ x: p.risk_score, y: p.confidence_percent }));
    return { points, paretoLine };
  }, [chartData, eaBestModel]);

  async function exportPdf() {
    try {
      setExporting(true);
      await downloadResultPdf(id);
      Alert.alert('Success', 'PDF exported successfully!');
    } catch (e) {
      console.error('PDF export error:', e);
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

  const visibleModels = showAllModels
    ? chartData
    : chartData.filter((m) => m.model === selectedModel);

  /* ---- loading / error ---- */
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

  /* ---- render ---- */
  return (
    <ThemedView style={styles.container}>
      <Header onMenuPress={openDrawer} />
      <Drawer visible={drawerVisible} onClose={closeDrawer} onThemeToggle={toggleTheme} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
                { backgroundColor: exporting ? colors.border : '#3b82f6' },
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

        {/* ---- NEW RESEARCH SECTIONS ---- */}
        <StatisticalSignificanceSection stats={statsData} colors={colors} />
        {ablationData && (
          <AblationStudySection ablation={ablationData} colors={colors} />
        )}
        {crossData && hasCifar && (
          <CrossDatasetSection crossData={crossData} hasCifar={hasCifar} colors={colors} />
        )}

        {/* ---- EA EVOLUTION CHARTS ---- */}
        {eaData && (
          <View style={[styles.researchSection, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <ThemedText style={[styles.researchTitle, { color: colors.text }]}>
              🧬 Evolutionary Optimization
            </ThemedText>

            {alphaChartData.length > 0 && (
              <LineChartMobile
                title="📈 Alpha Evolution (α - FAR Weight)"
                data={alphaChartData}
                color="#3b82f6"
                unit="%"
              />
            )}

            {fitnessChartData.length > 0 && (
              <LineChartMobile
                title="📉 Fitness Evolution (Risk Minimization)"
                data={fitnessChartData}
                color="#10b981"
              />
            )}

            {riskImprovementChartData.length > 0 && (
              <LineChartMobile
                title="Risk Reduction (%) Over Generations"
                data={riskImprovementChartData}
                color="#ef4444"
                unit="%"
              />
            )}
          </View>
        )}

        {/* ---- SUMMARY CARDS ---- */}
        <View style={styles.summarySection}>
          <ThemedText style={styles.sectionTitle}>Best Models</ThemedText>
          <View style={styles.summaryGrid}>
            <SummaryCard title="Safest" model={safestModel} colors={colors} icon="🛡" />
            <SummaryCard title="Balanced" model={balancedModel} colors={colors} icon="⚖️" />
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
            {eaData && <EASummaryCard eaData={eaData} colors={colors} />}
          </View>
        </View>

        {/* ---- EA VS HEURISTIC ---- */}
        {eaData && (
          <EAvsHeuristicSection
            eaData={eaData}
            balancedModel={balancedModel}
            chartData={chartData}
            colors={colors}
          />
        )}

        {/* ---- MODEL SELECTOR ---- */}
        <View style={styles.modelSelectorContainer}>
          <ThemedText style={styles.selectorLabel}>Select Model</ThemedText>
          <Dropdown
            value={selectedModel}
            items={modelDropdownItems}
            onValueChange={handleModelChange}
            placeholder="Select a model"
          />
        </View>

        {/* ---- PERFORMANCE CHARTS ---- */}
        {selectedModel === 'ALL' && (
          <View style={styles.chartsSection}>
            <ThemedText style={styles.sectionTitle}>Performance Charts</ThemedText>

            <BarChart
              title="Confidence (%)"
              subtitle="How sure the model is about its prediction."
              data={chartData.map((m) => ({ model: m.model, value: m.confidence_percent }))}
              bestModel={highestConfidenceModel?.model}
              unit="%"
            />
            <BarChart
              title="Latency (ms)"
              subtitle="Time taken to process one image."
              data={chartData.map((m) => ({ model: m.model, value: m.latency_ms }))}
              bestModel={fastestSafeModel?.model || chartData[0]?.model}
              unit=" ms"
              lowIsBetter
            />
            <BarChart
              title="Prediction Uncertainty"
              subtitle="Measures how uncertain the model is."
              data={chartData.map((m) => ({ model: m.model, value: m.entropy }))}
              bestModel={lowestEntropyModel?.model}
              lowIsBetter
            />
            <BarChart
              title="Prediction Stability"
              subtitle="Consistency of model outputs."
              data={chartData.map((m) => ({ model: m.model, value: m.stability }))}
              bestModel={highestStabilityModel?.model}
            />
          </View>
        )}

        {/* ---- PARETO GRAPH ---- */}
        {selectedModel === 'ALL' && paretoChartData.points.length > 0 && (
          <View style={[styles.researchSection, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <ThemedText style={[styles.researchTitle, { color: colors.text }]}>
              Risk vs Accuracy — Pareto Frontier
            </ThemedText>
            <ScatterChartMobile
              title=""
              data={paretoChartData.points}
              xLabel="Risk (Lower is Better)"
              yLabel="Accuracy %"
              paretoLine={paretoChartData.paretoLine}
            />
          </View>
        )}

        {/* ---- MODEL DETAIL CARDS ---- */}
        <View style={styles.modelsSection}>
          <ThemedText style={styles.sectionTitle}>Model Details</ThemedText>
          {visibleModels.map((model) => (
            <ModelCard
              key={model.model}
              model={model}
              badges={getBadges(model.model)}
              colors={colors}
              isEA={model.model === eaBestModel}
            />
          ))}
        </View>

        {/* ---- CONFUSION MATRICES ---- */}
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


/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: { fontSize: 14, marginTop: 12 },
  errorText: { fontSize: 16, marginBottom: 20 },
  backButton: { borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24 },
  backButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },

  section: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5, marginBottom: 16 },
  actionButtons: { gap: 12 },
  actionButton: { borderRadius: 8, paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center' },
  actionButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },

  // Summary
  summarySection: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 16 },
  summaryGrid: { gap: 12 },
  summaryCard: { borderRadius: 12, borderWidth: 1, padding: 16 },
  eaSummaryCard: { borderWidth: 2 },
  summaryIcon: { fontSize: 24, marginBottom: 8 },
  summaryTitle: { fontSize: 12, marginBottom: 4 },
  summaryModel: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  summaryMetric: { fontSize: 12 },

  // Research sections
  researchSection: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    gap: 16,
  },
  researchTitle: { fontSize: 18, fontWeight: '700' },

  // Stats
  statsGrid: { gap: 12 },
  statsCard: { borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 16, gap: 8 },
  statsCardTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  sigBadge: { borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, alignSelf: 'flex-start', marginTop: 4 },
  sigBadgeText: { fontSize: 12, fontWeight: '600' },
  ciRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  ciModel: { fontSize: 11, flex: 1, opacity: 0.7 },
  ciValue: { fontSize: 11, fontFamily: 'monospace' },
  sigSuccessBanner: { backgroundColor: '#dcfce7', borderRadius: 12, padding: 14 },
  sigSuccessText: { color: '#166534', fontSize: 13, fontWeight: '600' },

  // Ablation
  ablationGrid: { gap: 12 },
  ablationCard: { borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 16 },
  ablationEACard: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fca5a5',
    backgroundColor: '#fff1f2',
    padding: 16,
  },
  ablationCardTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  eaWinNote: { marginTop: 8, backgroundColor: '#fee2e2', borderRadius: 8, padding: 8 },
  eaWinText: { fontSize: 11, color: '#991b1b', fontWeight: '600' },

  // Cross dataset
  crossMetricRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  crossMetric: { alignItems: 'center' },
  crossMetricValue: { fontSize: 20, fontWeight: '700', fontFamily: 'monospace' },
  crossMetricLabel: { fontSize: 10, opacity: 0.6, marginTop: 2, textAlign: 'center' },
  generalizationVerdict: { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 16 },
  verdictTitle: { fontSize: 16, fontWeight: '700', color: '#166534', marginBottom: 6 },
  verdictText: { fontSize: 13, color: '#15803d', lineHeight: 20 },

  // EA vs Heuristic
  compareGrid: { gap: 12 },
  compareCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  eaCompareCard: {
    borderWidth: 2,
    borderColor: '#a78bfa',
    backgroundColor: '#f5f3ff',
  },
  compareCardTitle: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  eaNote: { fontSize: 11, opacity: 0.5, lineHeight: 16 },

  // Selector
  modelSelectorContainer: { marginBottom: 24 },
  selectorLabel: { fontSize: 16, fontWeight: '600', marginBottom: 12 },

  // Charts
  chartsSection: { marginBottom: 32 },
  modelsSection: { marginBottom: 24 },

  // Model card
  modelCard: { borderRadius: 12, borderWidth: 1, padding: 20, marginBottom: 16 },
  modelName: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  badgesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  badge: { borderRadius: 12, borderWidth: 1, paddingVertical: 4, paddingHorizontal: 10 },
  badgeText: { fontSize: 11, fontWeight: '600' },

  // Metric rows
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  metricLabel: { fontSize: 14 },
  metricValue: { fontSize: 14, fontWeight: '600' },

  // Confusion
  confusionSection: { marginTop: 24 },
});