"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"

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

/* ================= TAILWIND SAFE COLOR MAP ================= */

const COLOR = {
  emerald: {
    bar: "bg-gradient-to-r from-emerald-500 to-emerald-600",
    dot: "bg-emerald-500",
    border: "border-emerald-200",
    glow: "from-emerald-500 to-emerald-600",
    badge: "bg-emerald-100 text-emerald-800",
  },
  blue: {
    bar: "bg-gradient-to-r from-blue-500 to-blue-600",
    dot: "bg-blue-500",
    border: "border-blue-200",
    glow: "from-blue-500 to-blue-600",
    badge: "bg-blue-100 text-blue-800",
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
  if (Math.abs(v) < 0.001) return "text-gray-500"
  const bad = inverse ? v > 0 : v < 0
  return bad ? "text-red-600" : "text-green-600"
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

  const [doc, setDoc] = useState<ResultDoc | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/results/${id}`)
      .then(r => r.json())
      .then(setDoc)
      .finally(() => setLoading(false))
  }, [id])

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
          conf: cf.confidence_percent - mn.confidence_percent,
          lat: cf.latency_ms - mn.latency_ms,
          risk: cf.evaluation?.risk_score - mn.evaluation?.risk_score,
        },
      }
    }).filter(Boolean) as CompareRow[]
  }, [doc])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-14 h-14 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  /* ================= DATASET SUMMARY ================= */

  const datasetSummary = useMemo(() => {
    const avg = (n: number[]) => n.reduce((a, b) => a + b, 0) / n.length

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

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-100 p-10">
      <div className="max-w-7xl mx-auto space-y-16">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h1 className="text-5xl font-black">MNIST vs CIFAR</h1>
          <button
            onClick={() => router.push(`/results/${id}`)}
            className="px-6 py-3 bg-white rounded-xl shadow"
          >
            ← Back
          </button>
        </div>

        {/* DATASET WINNER */}
        <div
          className={`p-8 rounded-3xl border-4 shadow-xl ${
            datasetSummary.winner === "MNIST"
              ? "border-emerald-400 bg-emerald-50"
              : "border-blue-400 bg-blue-50"
          }`}
        >
          <h2 className="text-2xl font-bold mb-2">🏆 Dataset Winner</h2>
          <p className="text-4xl font-black mb-4">
            {datasetSummary.winner}
          </p>
          <ul className="text-sm space-y-1">
            <li>Accuracy: {winnerMetrics.conf.toFixed(2)}%</li>
            <li>Latency: {winnerMetrics.lat.toFixed(2)} ms</li>
            <li>Risk: {winnerMetrics.risk.toFixed(4)}</li>
          </ul>
        </div>

        {/* MODEL CARDS */}
        <div className="grid gap-10">
          {rows.map(r => (
            <div key={r.key} className="bg-white rounded-3xl shadow-xl">
              <div className="p-6 border-b">
                <h3 className="text-2xl font-bold">{r.label}</h3>
                <p className="text-sm text-gray-500">
                  Same architecture · dataset generalization
                </p>
              </div>

              <div className="p-8 grid md:grid-cols-3 gap-6">
                <MetricCard title="MNIST" data={r.mnist} color="emerald" />
                <MetricCard title="CIFAR" data={r.cifar} color="blue" />
                <DeltaCard delta={r.delta} />
              </div>
            </div>
          ))}
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
    <div className={`rounded-2xl p-6 border ${COLOR[color].border}`}>
      <h4 className="font-bold mb-4 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${COLOR[color].dot}`} />
        {title}
      </h4>
      <MetricBar label="Accuracy" value={data.conf} max={100} color={color} />
      <MetricBar label="Latency" value={data.lat} max={500} color={color} />
      <MetricBar label="Risk" value={data.risk} max={1} color={color} />
    </div>
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
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-mono">{value.toFixed(2)}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          className={`h-full rounded-full ${COLOR[color].bar}`}
        />
      </div>
    </div>
  )
}

function DeltaCard({ delta }: { delta: Metrics }) {
  return (
    <div className="rounded-2xl p-6 border-2 border-dashed border-gray-300">
      <h4 className="font-bold text-center mb-4">Δ CIFAR − MNIST</h4>
      <DeltaRow label="Accuracy" v={delta.conf} />
      <DeltaRow label="Latency" v={delta.lat} inverse />
      <DeltaRow label="Risk" v={delta.risk} inverse />
    </div>
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
    <div className={`flex justify-between ${deltaClass(v, inverse)}`}>
      <span>
        {deltaIcon(v, inverse)} {label}
      </span>
      <span className="font-mono">{v.toFixed(3)}</span>
    </div>
  )
}
