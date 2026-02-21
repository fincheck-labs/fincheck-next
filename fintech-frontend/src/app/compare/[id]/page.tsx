"use client"

import { useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import useSWR from "swr"

/* ================= FETCHER ================= */
const fetcher = (url: string) => fetch(url).then(r => r.json())

/* ================= CONSTANTS ================= */
const MODEL_ORDER = [
  "baseline_mnist.pth",
  "kd_mnist.pth",
  "lrf_mnist.pth",
  "pruned_mnist.pth",
  "quantized_mnist.pth",
  "ws_mnist.pth",
]

const MODEL_LABELS: Record<string, string> = {
  baseline: "Baseline",
  kd: "Knowledge Distillation",
  lrf: "Low-Rank Factorization",
  pruned: "Pruned",
  quantized: "Quantized",
  ws: "Weight Sharing",
}

const COLOR = {
  emerald: {
    bar: "bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600",
    dot: "bg-gradient-to-r from-emerald-400 to-emerald-500",
    border: "border-emerald-200/50",
    glass: "bg-emerald-500/5 backdrop-blur-sm",
  },
  blue: {
    bar: "bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600",
    dot: "bg-gradient-to-r from-blue-400 to-blue-500",
    border: "border-blue-200/50",
    glass: "bg-blue-500/5 backdrop-blur-sm",
  },
} as const

/* ================= TYPES ================= */
type ResultDoc = {
  data: {
    MNIST?: Record<string, any>
    CIFAR?: Record<string, any>
  }
}

type Metrics = {
  conf: number
  lat: number
  risk: number
}

type CompareRow = {
  key: string
  label: string
  mnist: Metrics
  cifar: Metrics
  delta: Metrics
}

/* ================= HELPERS ================= */
const archKey = (m: string) => m.split("_")[0]

const deltaClass = (v: number, inverse = false) => {
  if (Math.abs(v) < 0.001) return "text-neutral-400"
  const bad = inverse ? v > 0 : v < 0
  return bad ? "text-red-400" : "text-emerald-400"
}

const deltaIcon = (v: number, inverse = false) => {
  if (Math.abs(v) < 0.001) return "➖"
  const bad = inverse ? v > 0 : v < 0
  return bad ? "📉" : "📈"
}

/* ================= PAGE ================= */
export default function ComparePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: doc, error, isLoading } = useSWR<ResultDoc>(
    id ? `/api/results/${id}` : null,
    fetcher
  )

  const rows = useMemo<CompareRow[]>(() => {
    if (!doc?.data?.MNIST || !doc?.data?.CIFAR) return []

    return MODEL_ORDER.map(m => {
      const c = m.replace("mnist", "cifar")
      const mn = doc.data.MNIST![m]
      const cf = doc.data.CIFAR![c]
      if (!mn || !cf) return null

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
          risk:
            (cf.evaluation?.risk_score ?? 0) -
            (mn.evaluation?.risk_score ?? 0),
        },
      }
    }).filter(Boolean) as CompareRow[]
  }, [doc])

  const datasetSummary = useMemo(() => {
    if (!rows.length) {
      return {
        mnist: { conf: 0, lat: 0, risk: 0 },
        cifar: { conf: 0, lat: 0, risk: 0 },
        winner: "MNIST",
      }
    }

    const avg = (n: number[]) =>
      n.length ? n.reduce((a, b) => a + b, 0) / n.length : 0

    const mnist = {
      conf: avg(rows.map(r => r.mnist.conf)),
      lat: avg(rows.map(r => r.mnist.lat)),
      risk: avg(rows.map(r => r.mnist.risk)),
    }

    const cifar = {
      conf: avg(rows.map(r => r.cifar.conf)),
      lat: avg(rows.map(r => r.cifar.lat)),
      risk: avg(rows.map(r => r.cifar.risk)),
    }

    const winner =
      mnist.conf >= cifar.conf && mnist.risk <= cifar.risk
        ? "MNIST"
        : "CIFAR"

    return { mnist, cifar, winner }
  }, [rows])

  const winnerMetrics =
    datasetSummary.winner === "MNIST"
      ? datasetSummary.mnist
      : datasetSummary.cifar

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-100">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-neutral-200/50 border-t-emerald-500 rounded-2xl shadow-lg"
        />
      </div>
    )

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-indigo-100">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-12 max-w-md bg-white/60 backdrop-blur-sm rounded-3xl shadow-2xl border border-neutral-200/50"
        >
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">Failed to load data</h2>
          <p className="text-neutral-600">Please refresh the page or try again later</p>
        </motion.div>
      </div>
    )

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-100 p-4 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-12 lg:space-y-20">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
        >
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black bg-linear-to-r from-neutral-900 via-gray-900 to-neutral-700 bg-clip-text text-transparent leading-tight">
              MNIST vs CIFAR
            </h1>
            <p className="text-lg text-neutral-600 mt-3 max-w-lg">Model compression techniques performance comparison across datasets</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(`/results/${id}`)}
            className="px-8 py-4 bg-white/70 backdrop-blur-sm border border-neutral-200/50 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 font-semibold text-neutral-800 hover:bg-white"
          >
            ← Back to Results
          </motion.button>
        </motion.div>

        {/* Winner Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-8 lg:p-12 rounded-3xl shadow-2xl border-4 backdrop-blur-sm ${
            datasetSummary.winner === "MNIST"
              ? "border-emerald-400/40 bg-emerald-50/70"
              : "border-blue-400/40 bg-blue-50/70"
          } hover:shadow-3xl transition-all duration-500`}
        >
          <div className="flex items-start lg:items-center gap-6 mb-8">
            <motion.div 
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={`shrink-0 w-20 h-20 lg:w-24 lg:h-24 rounded-3xl shadow-2xl flex items-center justify-center text-3xl lg:text-4xl font-bold ${
                datasetSummary.winner === "MNIST" 
                  ? "bg-linear-to-r from-emerald-500 to-emerald-600 text-white shadow-emerald-500/25" 
                  : "bg-linear-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/25"
              }`}
            >
              🏆
            </motion.div>
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-3">Dataset Winner</h2>
              <p className="text-5xl lg:text-7xl font-black bg-linear-to-r from-neutral-900 via-neutral-800 to-neutral-600 bg-clip-text text-transparent tracking-tight">
                {datasetSummary.winner}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm lg:text-base">
            <div className="space-y-2 p-4 rounded-2xl bg-white/50 backdrop-blur-sm">
              <span className="text-neutral-500 font-semibold">Accuracy</span>
              <div className="text-3xl lg:text-4xl font-black text-neutral-900">{winnerMetrics.conf.toFixed(2)}%</div>
            </div>
            <div className="space-y-2 p-4 rounded-2xl bg-white/50 backdrop-blur-sm">
              <span className="text-neutral-500 font-semibold">Latency</span>
              <div className="text-3xl lg:text-4xl font-black text-neutral-900">{winnerMetrics.lat.toFixed(2)} ms</div>
            </div>
            <div className="space-y-2 p-4 rounded-2xl bg-white/50 backdrop-blur-sm">
              <span className="text-neutral-500 font-semibold">Risk Score</span>
              <div className="text-3xl lg:text-4xl font-black text-neutral-900">{winnerMetrics.risk.toFixed(4)}</div>
            </div>
          </div>
        </motion.div>

        {/* Model Comparison Cards */}
        <div className="grid gap-8 lg:gap-10">
          <AnimatePresence>
            {rows.map((r, i) => (
              <motion.div
                key={r.key}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="bg-white/60 backdrop-blur-sm rounded-4xl shadow-2xl border border-neutral-200/40 hover:shadow-3xl hover:border-neutral-300/60 transition-all duration-500 overflow-hidden group"
              >
                {/* Header */}
                <div className="p-8 lg:p-10 bg-linear-to-r from-neutral-50/80 via-white/70 to-neutral-50/50 border-b border-neutral-100/30">
                  <h3 className="text-3xl lg:text-4xl font-black bg-linear-to-r from-neutral-900 via-gray-900 to-neutral-700 bg-clip-text text-transparent">
                    {r.label}
                  </h3>
                </div>

                {/* Metrics Grid */}
                <div className="p-8 lg:p-12 grid md:grid-cols-3 gap-8 lg:gap-10">
                  <MetricCard title="MNIST" data={r.mnist} color="emerald" />
                  <MetricCard title="CIFAR" data={r.cifar} color="blue" />
                  <DeltaCard delta={r.delta} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

/* ================= COMPONENTS ================= */
function MetricCard({
  title,
  data,
  color,
}: {
  title: string
  data: Metrics
  color: "emerald" | "blue"
}) {
  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      className={`group/card rounded-3xl p-8 lg:p-10 border-2 shadow-xl hover:shadow-2xl transition-all duration-400 cursor-pointer backdrop-blur-sm ${
        COLOR[color].glass + " " + COLOR[color].border
      }`}
    >
      <div className="flex items-center gap-3 mb-8">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            ease: "linear"
          }}
          className={`w-4 h-4 lg:w-5 lg:h-5 rounded-full shadow-lg ${COLOR[color].dot}`}
        />
        <h4 className="text-2xl font-bold text-neutral-900">{title}</h4>
      </div>
      
      <MetricBar label="Accuracy" value={data.conf} max={100} color={color} />
      <MetricBar label="Latency" value={data.lat} max={500} color={color} />
      <MetricBar label="Risk" value={data.risk} max={1} color={color} />
    </motion.div>
  )
}

function MetricBar({
  label,
  value,
  max,
  color,
}: {
  label: string
  value: number
  max: number
  color: "emerald" | "blue"
}) {
  const pct = Math.min((value / max) * 100, 100)

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 group/bar"
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-4">
        <span className="text-lg font-semibold text-neutral-700 group-hover/card:text-neutral-900 transition-colors">{label}</span>
        <span className="text-2xl font-bold text-neutral-900">{value.toFixed(2)}</span>
      </div>
      <div className="h-4 lg:h-5 bg-neutral-200/40 rounded-3xl overflow-hidden shadow-inner border border-neutral-200/30">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          whileHover={{ scale: 1.02 }}
          className={`h-full rounded-3xl shadow-lg ${COLOR[color].bar}`}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        />
      </div>
    </motion.div>
  )
}

function DeltaCard({ delta }: { delta: Metrics }) {
  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      className="group rounded-3xl p-8 lg:p-10 border-2 border-dashed shadow-xl hover:shadow-2xl transition-all duration-400 backdrop-blur-sm bg-linear-to-b from-neutral-50/60 to-white/80 border-neutral-300/40 hover:border-neutral-400/60"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="w-4 h-4 lg:w-5 lg:h-5 rounded-full bg-linear-to-r from-neutral-400 to-neutral-500 shadow-lg animate-pulse" />
        <h4 className="text-2xl font-bold text-neutral-900">Δ CIFAR − MNIST</h4>
      </div>
      
      <DeltaRow label="Accuracy" v={delta.conf} />
      <DeltaRow label="Latency" v={delta.lat} inverse />
      <DeltaRow label="Risk" v={delta.risk} inverse />
    </motion.div>
  )
}

function DeltaRow({
  label,
  v,
  inverse = false,
}: {
  label: string
  v: number
  inverse?: boolean
}) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02, paddingLeft: 12 }}
      className={`flex justify-between items-center py-4 px-6 rounded-3xl mb-4 transition-all duration-300 group/row hover:bg-white/60 ${deltaClass(v, inverse)}`}
    >
      <span className="font-semibold text-lg flex items-center gap-3">
        <span className="text-2xl">{deltaIcon(v, inverse)}</span>
        {label}
      </span>
      <span className="text-2xl font-bold">{v.toFixed(3)}</span>
    </motion.div>
  )
}
