
"use client"

import { useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
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
    bar: "bg-gradient-to-r from-emerald-500 to-emerald-600",
    dot: "bg-emerald-500",
    border: "border-emerald-200",
  },
  blue: {
    bar: "bg-gradient-to-r from-blue-500 to-blue-600",
    dot: "bg-blue-500",
    border: "border-blue-200",
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

  /* ================= SWR FETCH ================= */

  const { data: doc, error, isLoading } = useSWR<ResultDoc>(
    id ? `/api/results/${id}` : null,
    fetcher
  )

  /* ================= ROWS ================= */

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

  /* ================= DATASET SUMMARY ================= */

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

  /* ================= STATES ================= */

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-14 h-14 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Failed to load data
      </div>
    )

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-100 p-10">
      <div className="max-w-7xl mx-auto space-y-16">

        <div className="flex justify-between items-center">
          <h1 className="text-5xl font-black">MNIST vs CIFAR</h1>
          <button
            onClick={() => router.push(`/results/${id}`)}
            className="px-6 py-3 bg-white rounded-xl shadow"
          >
            ← Back
          </button>
        </div>

        <div
          className={`p-8 rounded-3xl border-4 shadow-xl ${
            datasetSummary.winner === "MNIST"
              ? "border-emerald-400 bg-emerald-50"
              : "border-blue-400 bg-blue-50"
          }`}
        >
          <h2 className="text-2xl font-bold mb-2">🏆 Dataset Winner</h2>
          <p className="text-4xl font-black">{datasetSummary.winner}</p>
          <ul className="text-sm">
            <li>Accuracy: {winnerMetrics.conf.toFixed(2)}%</li>
            <li>Latency: {winnerMetrics.lat.toFixed(2)} ms</li>
            <li>Risk: {winnerMetrics.risk.toFixed(4)}</li>
          </ul>
        </div>

        <div className="grid gap-10">
          {rows.map(r => (
            <div key={r.key} className="bg-white rounded-3xl shadow-xl">
              <div className="p-6 border-b">
                <h3 className="text-2xl font-bold">{r.label}</h3>
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
      <h4 className="font-bold mb-4">{title}</h4>
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
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>{value.toFixed(2)}</span>
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
      <h4 className="font-bold mb-4">Δ CIFAR − MNIST</h4>
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
      <span>{v.toFixed(3)}</span>
    </div>
  )
}
