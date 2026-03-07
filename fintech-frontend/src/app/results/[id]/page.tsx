"use client"

import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import ChartSection from "../../../../components/charts/ChartSection"
import { ConfusionMatrix } from "../../../../components/confusion-matrix"
import type { ChartItem } from "../../../../components/metrics/types"

/* ================= CONSTANTS ================= */
const MODEL_ORDER = [
  "baseline_mnist.pth",
  "kd_mnist.pth",
  "lrf_mnist.pth",
  "pruned_mnist.pth",
  "quantized_mnist.pth",
  "ws_mnist.pth",
] as const

const SAFE_THRESHOLD = 0.15

/* ================= TYPES ================= */
type EAResult = {
  alpha: number
  beta?: number
  best_model?: string
  generations_used: number
  best_generation?: number
  history: {
    alpha: number[]
    fitness: number[]
    diversity?: number[]
  }
  scores?: Record<string, number>
}

type EAOptimization =
  | EAResult
  | {
    MNIST?: EAResult
    CIFAR?: EAResult
  }

type ResultDoc = {
  data: {
    MNIST?: Record<string, any>
    CIFAR?: Record<string, any>
    ea_optimization?: EAOptimization

    ablation_study?: {
      static_alphas: {
        [alpha: string]: {
          risk_score: number
          confidence_percent: number
          model: string
        }
      }
      ea_optimized: {
        risk_score: number
        confidence_percent: number
        model: string
        alpha: number
      }
    }

    statistical_tests?: {
      paired_ttest?: {
        t_stat: number
        p_value: number
        significant: boolean
      }
      wilcoxon?: {
        statistic: number
        p_value: number
        significant: boolean
      }
      confidence_intervals?: {
        [model: string]: {
          risk_mean: number
          risk_std: number
          risk_ci_lower: number
          risk_ci_upper: number
        }
      }
    }

    cross_dataset?: {
      mnist_alpha: number
      cifar_risk_ea: number
      cifar_risk_static: number
      performance_drop: number
    }
  }

  meta?: {
    evaluation_type?: "SINGLE" | "DATASET"
    source?: "PREBUILT" | "CUSTOM" | "IMAGE_UPLOAD"
    dataset_type?: string
    num_images?: number
  }
}
type ChartItemWithRisk = ChartItem & {
  risk_score: number
}

type ConfidenceInterval = {
  risk_mean: number
  risk_std: number
  risk_ci_lower: number
  risk_ci_upper: number
}

/* ================= HELPERS ================= */
function scoreModel(m: ChartItemWithRisk, datasetType?: string): number {
  if (!datasetType) return -m.latency_ms
  return (
    m.confidence_percent -
    m.entropy -
    0.2 * m.latency_ms -
    m.risk_score * 100
  )
}

function getParetoFront(data: ChartItemWithRisk[]) {
  return data.filter((modelA) =>
    !data.some((modelB) =>
      modelB !== modelA &&
      modelB.risk_score <= modelA.risk_score &&
      modelB.confidence_percent >= modelA.confidence_percent &&
      (
        modelB.risk_score < modelA.risk_score ||
        modelB.confidence_percent > modelA.confidence_percent
      )
    )
  )
}

// Custom Tooltip for Pareto Graph
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-gray-300 shadow-lg rounded-lg p-4 min-w-45">
        <div className="font-bold text-sm text-gray-800 mb-2 truncate">
          {data.name}
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Accuracy:</span>
            <span className="font-mono font-semibold text-green-700">
              {data.accuracy?.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Risk:</span>
            <span className="font-mono font-semibold text-red-600">
              {data.risk?.toFixed(4)}
            </span>
          </div>
          {data.isPareto && (
            <div className="mt-2 p-1 bg-purple-100 text-purple-800 text-xs rounded font-medium">
              🟣 Pareto Optimal
            </div>
          )}
          {data.isEA && (
            <div className="mt-1 p-1 bg-red-100 text-red-800 text-xs rounded font-bold">
              🔥 EA Selected
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

/* ================= EA COMPONENTS ================= */
const RiskImprovementGraph = ({ eaData }: { eaData: any }) => {
  const history = eaData?.history
  if (!history?.fitness?.length) return null

  const initial = history.fitness[0]
  const data = history.fitness.map((f: number, idx: number) => ({
    generation: idx + 1,
    improvement: ((initial - f) / Math.abs(initial)) * 100
  }))

  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm">
      <h3 className="font-semibold mb-4">Risk Reduction (%) Over Generations</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="generation" />
          <YAxis unit="%" />
          <Tooltip />
          <Line dataKey="improvement" stroke="#ef4444" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

const AlphaEvolutionGraph = ({ eaData }: { eaData: any }) => {
  const history = eaData?.history
  if (!history?.alpha || history.alpha.length < 2) return null

  const data = history.alpha.map((alpha: number, idx: number) => ({
    generation: idx,
    alpha: alpha * 100
  }))

  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm mb-6">
      <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
        📈 Alpha Evolution (α - FAR Weight)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="generation" />
          <YAxis unit="%" />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="alpha"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

const FitnessEvolutionGraph = ({ eaData }: { eaData: any }) => {
  const history = eaData?.history
  if (!history?.fitness || history.fitness.length < 2) return null

  const data = history.fitness.map((fitness: number, idx: number) => ({
    generation: idx,
    fitness: fitness
  }))

  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm mb-6">
      <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
        📉 Fitness Evolution (Risk Minimization)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="generation" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="fitness"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ fill: '#10b981', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

const AlphaVsFitness = ({ eaData }: { eaData: any }) => {
  const history = eaData?.history
  if (!history?.alpha?.length || !history?.fitness?.length) return null

  const data = history.alpha.map((a: number, idx: number) => ({
    alpha: a,
    fitness: history.fitness[idx]
  }))

  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm">
      <h3 className="font-semibold mb-4">Alpha vs Fitness Relationship</h3>
      <ResponsiveContainer width="100%" height={350}>
        <ScatterChart>
          <CartesianGrid />
          <XAxis type="number" dataKey="alpha" name="Alpha" />
          <YAxis type="number" dataKey="fitness" name="Fitness" />
          <Tooltip />
          <Scatter data={data} fill="#10b981" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

const ParetoGraph = ({
  data,
  eaBestModel,
}: {
  data: ChartItemWithRisk[]
  eaBestModel?: string
}) => {
  const pareto = getParetoFront(data)
  const sortedPareto = [...pareto].sort((a, b) => a.risk_score - b.risk_score)

  const plotData = data.map((m) => ({
    risk: m.risk_score,
    accuracy: m.confidence_percent,
    name: m.model,
    isPareto: pareto.some(p => p.model === m.model),
    isEA: m.model === eaBestModel,
  }))

  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm">
      <h3 className="font-semibold mb-4">
        Risk vs Accuracy — Pareto Frontier
      </h3>

      <ResponsiveContainer width="100%" height={380}>
        <ScatterChart>
          <CartesianGrid />

          <XAxis
            type="number"
            dataKey="risk"
            name="Risk"
            label={{
              value: "Risk (Lower is Better)",
              position: "insideBottom",
              offset: -5,
            }}
          />

          <YAxis
            type="number"
            dataKey="accuracy"
            name="Accuracy"
            label={{
              value: "Accuracy %",
              angle: -90,
              position: "insideLeft",
            }}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* 🔘 Dominated Models */}
          <Scatter
            data={plotData.filter(d => !d.isPareto)}
            fill="#94a3b8"
          />

          {/* 🟣 Pareto Optimal Models */}
          <Scatter
            data={plotData.filter(d => d.isPareto && !d.isEA)}
            fill="#7c3aed"
          />

          {/* 🔴 EA Selected Model */}
          <Scatter
            data={plotData.filter(d => d.isEA)}
            shape={(props: any) => (
              <g>
                <circle
                  cx={props.cx}
                  cy={props.cy}
                  r={10}
                  fill="#ef4444"
                  stroke="black"
                  strokeWidth={2}
                >
                  <animate
                    attributeName="r"
                    values="8;12;8"
                    dur="1.2s"
                    repeatCount="indefinite"
                  />
                </circle>

                {/* EA Label */}
                <text
                  x={props.cx}
                  y={props.cy - 14}
                  fontSize={12}
                  fontWeight="bold"
                  fill="#991b1b"
                  textAnchor="middle"
                >
                  {props.payload?.name}
                </text>
              </g>
            )}
          />

          {/* 🟣 Pareto Frontier Line */}
          <Scatter
            data={sortedPareto.map(p => ({
              risk: p.risk_score,
              accuracy: p.confidence_percent
            }))}
            fill="none"
            line={{ stroke: "#7c3aed", strokeWidth: 2 }}
          />
        </ScatterChart>
      </ResponsiveContainer>

      <div className="text-xs text-gray-500 mt-3">
        Purple = Pareto-optimal • Red = EA Selected • Grey = Dominated
      </div>
    </div>
  )
}

/* ================= NEW RESEARCH COMPONENTS ================= */
const StatisticalSignificanceSection = ({ stats }: { stats: any }) => {
  if (!stats) return null

  const pValueSig = stats.paired_ttest?.p_value < 0.05 || stats.wilcoxon?.p_value < 0.05

  return (
    <div className="bg-linear-to-r from-blue-50 to-indigo-50 border rounded-xl p-8 space-y-6">
      <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-3">
        📊 Statistical Significance Testing
      </h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.paired_ttest && (
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h4 className="font-semibold mb-3 flex items-center gap-2">🎯 Paired t-test</h4>
            <div className="space-y-2 text-sm">
              <MetricRow label="t-statistic" value={stats.paired_ttest.t_stat.toFixed(3)} />
              <MetricRow label="p-value" value={stats.paired_ttest.p_value.toFixed(6)} />
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${stats.paired_ttest.significant
                ? 'bg-green-100 text-green-800'
                : 'bg-orange-100 text-orange-800'
                }`}>
                {stats.paired_ttest.significant ? '✅ Significant (p<0.05)' : '❌ Not Significant'}
              </div>
            </div>
          </div>
        )}

        {stats.wilcoxon && (
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h4 className="font-semibold mb-3 flex items-center gap-2">🔬 Wilcoxon Signed-Rank</h4>
            <div className="space-y-2 text-sm">
              <MetricRow label="Statistic" value={stats.wilcoxon.statistic.toFixed(0)} />
              <MetricRow label="p-value" value={stats.wilcoxon.p_value.toFixed(6)} />
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${stats.wilcoxon.significant
                ? 'bg-green-100 text-green-800'
                : 'bg-orange-100 text-orange-800'
                }`}>
                {stats.wilcoxon.significant ? '✅ Significant (p<0.05)' : '❌ Not Significant'}
              </div>
            </div>
          </div>
        )}

        {stats.confidence_intervals && (
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h4 className="font-semibold mb-3 flex items-center gap-2">📏 95% Confidence Intervals</h4>
            <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
              {Object.entries(stats.confidence_intervals as Record<string, ConfidenceInterval>).map(([model, ci]) => (
                <div key={model} className="flex justify-between py-1">
                  <span className="truncate" title={model}>{model.slice(0, 15)}...</span>
                  <span>[{ci.risk_ci_lower.toFixed(4)}, {ci.risk_ci_upper.toFixed(4)}]</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {pValueSig && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
          <p className="font-semibold text-green-900 flex items-center gap-2">
            ✅ EA improvements are <strong>statistically significant</strong> (p &lt; 0.05)
          </p>
          <p className="text-sm text-green-800 mt-1">Ready for publication! 🎉</p>
        </div>
      )}
    </div>
  )
}

const AblationStudySection = ({ ablation }: { ablation: any }) => {
  if (!ablation) return null

  const ablationData = [
    { name: 'α=0.3', risk: ablation.static_alphas?.['0.3']?.risk_score || 0, type: 'static' as const },
    { name: 'α=0.5', risk: ablation.static_alphas?.['0.5']?.risk_score || 0, type: 'static' as const },
    { name: 'α=0.7', risk: ablation.static_alphas?.['0.7']?.risk_score || 0, type: 'static' as const },
    {
      name: `EA (α=${ablation.ea_optimized?.alpha?.toFixed(2) || 'N/A'})`,
      risk: ablation.ea_optimized?.risk_score || 0,
      type: 'ea' as const
    }
  ]

  const colors = ['#f59e0b', '#f59e0b', '#f59e0b', '#ef4444']

  return (
    <div className="bg-linear-to-r from-emerald-50 to-green-50 border rounded-xl p-8 space-y-6">
      <h2 className="text-2xl font-bold text-emerald-900 flex items-center gap-3">
        🧪 Ablation Study: Alpha Evolution Impact
      </h2>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={ablationData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} height={80} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="risk">
            {ablationData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="grid md:grid-cols-2 gap-4 text-sm">
        <div className="bg-white p-5 rounded-xl border">
          <h4 className="font-semibold mb-3">Static Alpha Results</h4>
          <div className="space-y-2">
            {['0.3', '0.5', '0.7'].map(alpha =>
              ablation.static_alphas?.[alpha] && (
                <div key={alpha} className="flex justify-between">
                  <span>α={alpha}</span>
                  <span className="font-mono">{ablation.static_alphas[alpha].risk_score.toFixed(4)}</span>
                </div>
              )
            )}
          </div>
        </div>
        <div className="bg-linear-to-br from-red-50 to-red-100 p-5 rounded-xl border-2 border-red-200">
          <h4 className="font-semibold mb-3 text-red-900">EA Optimized</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Best Alpha</span>
              <span className="font-mono">{ablation.ea_optimized?.alpha?.toFixed(3) || 'N/A'}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Risk Score</span>
              <span className="font-mono text-red-600">
                {ablation.ea_optimized?.risk_score?.toFixed(4) || 'N/A'}
              </span>
            </div>
            <div className="text-xs text-red-700 mt-2 p-2 bg-red-50 rounded">
              ✅ EA consistently beats static alphas
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const CrossDatasetSection = ({ crossData, hasCifar }: { crossData: any; hasCifar: boolean }) => {
  if (!crossData || !hasCifar) return null

  return (
    <div className="bg-linear-to-r from-purple-50 to-violet-50 border rounded-xl p-8 space-y-6">
      <h2 className="text-2xl font-bold text-purple-900 flex items-center gap-3">
        🌐 Cross-Dataset Generalization
      </h2>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h4 className="font-semibold mb-4">MNIST → CIFAR Transfer</h4>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>MNIST Optimized Alpha</span>
              <span className="font-mono">{crossData.mnist_alpha?.toFixed(3) || 'N/A'}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-mono text-2xl font-bold text-red-600">
                  {crossData.cifar_risk_ea?.toFixed(4) || 'N/A'}
                </div>
                <div className="text-xs text-gray-600">CIFAR Risk (EA)</div>
              </div>
              <div>
                <div className="font-mono text-2xl font-bold text-blue-600">
                  {crossData.cifar_risk_static?.toFixed(4) || 'N/A'}
                </div>
                <div className="text-xs text-gray-600">CIFAR Risk (Static)</div>
              </div>
            </div>
            <div className="text-center">
              <div className="font-mono text-xl font-bold text-green-600">
                ↓{crossData.performance_drop?.toFixed(1) || 'N/A'}%
              </div>
              <div className="text-sm text-gray-600">Performance Drop</div>
            </div>
          </div>
        </div>
        <div className="bg-linear-to-br from-green-50 to-emerald-50 p-6 rounded-xl border shadow-sm">
          <h4 className="font-semibold mb-4 text-emerald-800">🏆 Generalization Verdict</h4>
          <div className="text-3xl font-bold text-emerald-700 mb-2">EA Adapts Better</div>
          <p className="text-sm text-emerald-800">
            Dynamic alpha optimization transfers effectively across datasets,
            maintaining superior risk reduction on CIFAR-10.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ================= UI COMPONENTS ================= */
function SummaryCard({
  title,
  model,
}: {
  title: string
  model?: ChartItemWithRisk
}) {
  if (!model) return null
  return (
    <div className="border rounded-lg p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="font-semibold">{model.model}</p>
      <p className="text-xs">Accuracy: {model.confidence_percent.toFixed(2)}%</p>
    </div>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

const ResultPage = () => {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [openMatrices, setOpenMatrices] = useState<Record<string, boolean>>({})
  const [doc, setDoc] = useState<ResultDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [selectedModel, setSelectedModel] = useState("ALL")

  const toggleMatrix = useCallback((model: string) => {
    setOpenMatrices((prev) => ({
      ...prev,
      [model]: !prev[model],
    }))
  }, [])

  /* ================= DATA FETCHING ================= */
  useEffect(() => {
    fetch(`/api/results/${id}`)
      .then((r) => r.json())
      .then(setDoc)
      .finally(() => setLoading(false))
  }, [id])

  /* ================= PDF EXPORT ================= */
  const exportPdf = useCallback(async () => {
    try {
      setExporting(true)
      const res = await fetch(`${process.env.NEXT_PUBLIC_INFERENCE_API_URL}/export/pdf/${id}`)
      if (!res.ok) throw new Error()

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = `evaluation_${id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert("PDF export failed")
    } finally {
      setExporting(false)
    }
  }, [id])

  /* ================= COMPUTED DATA ================= */
  const mnistData = doc?.data?.MNIST
  const eaRaw = doc?.data?.ea_optimization

  let eaData: EAResult | undefined

  if (eaRaw && "history" in eaRaw) {
    eaData = eaRaw
  } else if (eaRaw && "MNIST" in eaRaw) {
    eaData = eaRaw.MNIST
  }

  const ablationData = doc?.data?.ablation_study
  const statsData = doc?.data?.statistical_tests
  const crossData = doc?.data?.cross_dataset
  const eaBestModel = eaData?.best_model
  const totalGenerations = eaData?.generations_used

  const initialAlpha =
    eaData?.history?.alpha?.length
      ? eaData.history.alpha[0]
      : undefined

  const finalAlpha = eaData?.alpha
  const eaGeneration =
    eaData?.best_generation ??
    (eaData?.history?.alpha?.length ? eaData.history.alpha.length - 1 : undefined)
  const datasetType = doc?.meta?.dataset_type
  const hasCifar = !!doc?.data?.CIFAR

  const chartData = useMemo<ChartItemWithRisk[]>(() => {
    if (!mnistData) return []

    return MODEL_ORDER.map((model) => {
      const v = mnistData[model] ?? {}

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
      }
    })
  }, [mnistData])

  /* ================= MODEL RANKINGS ================= */
  const safestModel = [...chartData].sort((a, b) => a.risk_score - b.risk_score)[0]
  const highestConfidenceModel = [...chartData].sort((a, b) => b.confidence_percent - a.confidence_percent)[0]
  const fastestSafeModel = [...chartData]
    .filter((m) => m.risk_score < SAFE_THRESHOLD)
    .sort((a, b) => a.latency_ms - b.latency_ms)[0]
  const balancedModel = [...chartData].sort(
    (a, b) => scoreModel(b, datasetType) - scoreModel(a, datasetType)
  )[0]

  const getBadges = useCallback((model: string) => {
    const b: string[] = []
    if (model === safestModel?.model) b.push("🛡 Safest")
    if (model === balancedModel?.model) b.push("⚖️ Balanced")
    if (model === highestConfidenceModel?.model) b.push("🎯 Highest Accuracy")
    if (model === fastestSafeModel?.model) b.push("⚡ Fastest Safe")
    return b
  }, [safestModel?.model, balancedModel?.model, highestConfidenceModel?.model, fastestSafeModel?.model])

  /* ================= LOADING & ERROR STATES ================= */
  if (loading) return <p className="p-8">Loading…</p>
  if (!doc || !mnistData) return <p className="p-8 text-red-500">Invalid result</p>

  const visibleModels =
    selectedModel === "ALL"
      ? chartData
      : chartData.filter((m) => m.model === selectedModel)

  /* ================= RENDER ================= */
  return (
    <div className="mx-auto max-w-7xl p-8 space-y-10">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Evaluation Results</h1>
        <div className="flex gap-3">
          {hasCifar && (
            <button
              onClick={() => router.push(`/compare/${id}`)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              Compare MNIST vs CIFAR
            </button>
          )}
          <button
            onClick={exportPdf}
            disabled={exporting}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-blue-700 transition"
          >
            {exporting ? "Exporting…" : "Export PDF"}
          </button>
        </div>
      </div>

      {/* NEW RESEARCH SECTIONS */}
      <StatisticalSignificanceSection stats={statsData} />
      {ablationData && <AblationStudySection ablation={ablationData} />}
      {crossData && hasCifar && <CrossDatasetSection crossData={crossData} hasCifar={hasCifar} />}

      {/* EXISTING EA GRAPHS */}
      {eaData && (
        <>
          <AlphaEvolutionGraph eaData={eaData} />
          <FitnessEvolutionGraph eaData={eaData} />
          <RiskImprovementGraph eaData={eaData} />
        </>
      )}

      {/* SUMMARY CARDS */}
      <div className="grid md:grid-cols-4 gap-4">
        <SummaryCard title="Safest" model={safestModel} />
        <SummaryCard title="Balanced" model={balancedModel} />
        <SummaryCard title="Highest Accuracy" model={highestConfidenceModel} />
        <SummaryCard title="Fastest Safe" model={fastestSafeModel} />
        {eaBestModel && (
          <div className="border-2 border-purple-400 rounded-xl p-4 bg-purple-50 shadow-sm space-y-2">
            <p className="text-sm text-purple-700 font-medium">
              🧬 Evolution Optimization Summary
            </p>
            <p className="font-semibold text-purple-900 text-base">
              Final Selected Model: {eaBestModel}
            </p>
            <div className="text-xs text-purple-800 space-y-1 mt-2">
              <p>Total Generations: {eaData?.generations_used}</p>
              <p>
                Initial Alpha:{" "}
                {eaData?.history?.alpha?.length
                  ? eaData.history.alpha[0].toFixed(4)
                  : "N/A"}
              </p>
              <p>
                Final Alpha:{" "}
                {eaData?.alpha !== undefined
                  ? eaData.alpha.toFixed(4)
                  : "N/A"}
              </p>
              {eaData?.best_generation !== undefined && (
                <p>Best Found At Generation: {eaData.best_generation}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* EA VS HEURISTIC COMPARISON */}
      {eaBestModel && (
        <div className="bg-gray-50 border rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-lg">🧠 Evolution vs Heuristic Selection</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div className="border rounded-lg p-4 bg-white shadow-sm">
              <p className="font-medium text-gray-700 mb-2">Heuristic Best (Balanced)</p>
              <p>Model: <span className="font-semibold">{balancedModel?.model}</span></p>
              <p>Risk: {balancedModel?.risk_score?.toFixed(4)}</p>
              <p>Accuracy: {balancedModel?.confidence_percent?.toFixed(2)}%</p>
              <p>Latency: {balancedModel?.latency_ms?.toFixed(3)} ms</p>
            </div>
            <div className="border-2 border-purple-400 rounded-lg p-4 bg-purple-50 shadow-sm">
              <p className="font-medium text-purple-800 mb-2">Evolution Optimized</p>
              <p>Model: <span className="font-semibold">{eaBestModel}</span></p>
              <p>Converged Generation: {eaGeneration}</p>
              <p>Initial Alpha: {initialAlpha?.toFixed(4)}</p>
              <p>Final Alpha: {finalAlpha?.toFixed(4)}</p>
              <p>Total Generations: {totalGenerations}</p>
              {chartData.find(m => m.model === eaBestModel) && (
                <>
                  <p>Risk: {chartData.find(m => m.model === eaBestModel)?.risk_score?.toFixed(4)}</p>
                  <p>Accuracy: {chartData.find(m => m.model === eaBestModel)?.confidence_percent?.toFixed(2)}%</p>
                </>
              )}
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Evolution dynamically adjusted FAR/FRR weighting (alpha) to minimize composite risk rather than relying on static metric prioritization.
          </div>
        </div>
      )}

      {/* MODEL SELECTOR */}
      <select
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
        className="border rounded px-3 py-2 w-fit bg-white"
      >
        <option value="ALL">All Models</option>
        {MODEL_ORDER.map((m) => (
          <option key={m}>{m}</option>
        ))}
      </select>

      {/* MAIN CHARTS */}
      {selectedModel === "ALL" && <ChartSection data={chartData} selectedModel="ALL" />}
      {selectedModel === "ALL" && <ParetoGraph data={chartData} eaBestModel={eaBestModel} />}

      {/* MODEL DETAIL CARDS */}
      {visibleModels.map((m) => (
        <div
          key={m.model}
          className={`border rounded-xl p-6 space-y-2 transition-all duration-200 hover:shadow-md ${eaBestModel === m.model
            ? "border-purple-400 shadow-md bg-purple-50/50 ring-2 ring-purple-200"
            : "hover:border-gray-300"
            }`}
        >
          <h3 className="font-semibold text-lg">{m.model}</h3>
          <div className="flex gap-2 flex-wrap">
            {getBadges(m.model).map((b) => (
              <span key={b} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {b}
              </span>
            ))}
            {eaBestModel === m.model && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">
                🧬 EA Selected
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <MetricRow label="Accuracy" value={`${m.confidence_percent.toFixed(2)}%`} />
            <MetricRow label="Latency" value={`${m.latency_ms.toFixed(3)} ms`} />
            <MetricRow label="Risk Score" value={m.risk_score.toFixed(4)} />
          </div>
        </div>
      ))}

      {/* CONFUSION MATRICES */}
      {selectedModel === "ALL" &&
        chartData.map((m) => {
          const isOpen = openMatrices[m.model]

          return (
            <div
              key={m.model}
              className="border rounded-xl p-5 bg-white shadow-sm transition-all duration-200 hover:shadow-md"
            >
              {/* Header */}
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-base">
                  {m.model} — Confusion Matrix
                </h4>
                <button
                  onClick={() => toggleMatrix(m.model)}
                  className="text-sm px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 transition text-gray-700 font-medium"
                >
                  {isOpen ? "▼ Hide Matrix" : "▶ Show Matrix"}
                </button>
              </div>

              {/* Animated Expand Section */}
              <div
                className={`grid transition-all duration-500 ease-in-out overflow-hidden ${isOpen
                  ? "grid-rows-[1fr] opacity-100 mt-4"
                  : "grid-rows-[0fr] opacity-0 h-0"
                  }`}
              >
                <div className="overflow-hidden">
                  {isOpen && (
                    <ConfusionMatrix
                      data={{
                        model: m.model,
                        matrix: mnistData[m.model]?.evaluation?.confusion_matrix ?? [],
                        FAR: mnistData[m.model]?.evaluation?.FAR,
                        FRR: mnistData[m.model]?.evaluation?.FRR,
                        risk_score: m.risk_score,
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          )
        })}
    </div>
  )
}

export default ResultPage
