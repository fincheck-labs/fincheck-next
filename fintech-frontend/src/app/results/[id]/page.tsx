"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import ChartSection from "../../../../components/charts/ChartSection"
import type { ChartItem } from "../../../../components/metrics/types"
import { ConfusionMatrix } from "../../../../components/confusion-matrix"

/* ================= CONSTANTS ================= */

const MODEL_ORDER = [
  "baseline_mnist.pth",
  "kd_mnist.pth",
  "lrf_mnist.pth",
  "pruned_mnist.pth",
  "quantized_mnist.pth",
  "ws_mnist.pth",
]

const SAFE_THRESHOLD = 0.15

/* ================= TYPES ================= */

type ResultDoc = {
  data: {
    MNIST?: Record<string, any>
    CIFAR?: Record<string, any>
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

/* ================= HELPERS ================= */

function scoreModel(m: ChartItemWithRisk, datasetType?: string) {
  if (!datasetType) return -m.latency_ms
  return (
    m.confidence_percent -
    m.entropy -
    0.2 * m.latency_ms -
    m.risk_score * 100
  )
}

/* ================= PAGE ================= */

export default function ResultPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [doc, setDoc] = useState<ResultDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [selectedModel, setSelectedModel] = useState("ALL")

  useEffect(() => {
    fetch(`/api/results/${id}`)
      .then((r) => r.json())
      .then(setDoc)
      .finally(() => setLoading(false))
  }, [id])

  /* ================= EXPORT PDF ================= */

  async function exportPdf() {
    try {
      setExporting(true)
      const res = await fetch(`/api/export/pdf/${id}`)
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
  }

  /* ================= DATA ================= */

  const mnistData = doc?.data?.MNIST
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

  /* ================= BEST MODELS ================= */

  const safestModel = [...chartData].sort(
    (a, b) => a.risk_score - b.risk_score
  )[0]

  const highestConfidenceModel = [...chartData].sort(
    (a, b) => b.confidence_percent - a.confidence_percent
  )[0]

  const fastestSafeModel = [...chartData]
    .filter((m) => m.risk_score < SAFE_THRESHOLD)
    .sort((a, b) => a.latency_ms - b.latency_ms)[0]

  const balancedModel = [...chartData].sort(
    (a, b) => scoreModel(b, datasetType) - scoreModel(a, datasetType)
  )[0]

  function getBadges(model: string) {
    const b: string[] = []
    if (model === safestModel?.model) b.push("🛡 Safest")
    if (model === balancedModel?.model) b.push("⚖️ Balanced")
    if (model === highestConfidenceModel?.model)
      b.push("🎯 Highest Accuracy")
    if (model === fastestSafeModel?.model)
      b.push("⚡ Fastest Safe")
    return b
  }

  if (loading) return <p className="p-8">Loading…</p>
  if (!doc || !mnistData)
    return <p className="p-8 text-red-500">Invalid result</p>

  const visibleModels =
    selectedModel === "ALL"
      ? chartData
      : chartData.filter((m) => m.model === selectedModel)

  return (
    <div className="mx-auto max-w-7xl p-8 space-y-10">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Evaluation Results</h1>

        <div className="flex gap-3">
          {hasCifar && (
            <button
              onClick={() => router.push(`/compare/${id}`)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg"
            >
              Compare MNIST vs CIFAR
            </button>
          )}

          <button
            onClick={exportPdf}
            disabled={exporting}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {exporting ? "Exporting…" : "Export PDF"}
          </button>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid md:grid-cols-4 gap-4">
        <SummaryCard title="Safest" model={safestModel} />
        <SummaryCard title="Balanced" model={balancedModel} />
        <SummaryCard title="Highest Accuracy" model={highestConfidenceModel} />
        <SummaryCard title="Fastest Safe" model={fastestSafeModel} />
      </div>

      {/* MODEL SELECT */}
      <select
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
        className="border rounded px-3 py-2"
      >
        <option value="ALL">All Models</option>
        {MODEL_ORDER.map((m) => (
          <option key={m}>{m}</option>
        ))}
      </select>

      {/* CHART */}
      {selectedModel === "ALL" && (
        <ChartSection data={chartData} selectedModel="ALL" />
      )}

      {/* MODEL CARDS */}
      {visibleModels.map((m) => (
        <div key={m.model} className="border rounded-xl p-6 space-y-2">
          <h3 className="font-semibold">{m.model}</h3>

          <div className="flex gap-2 flex-wrap">
            {getBadges(m.model).map((b) => (
              <span
                key={b}
                className="text-xs bg-blue-100 px-2 py-1 rounded"
              >
                {b}
              </span>
            ))}
          </div>

          <MetricRow
            label="Accuracy"
            value={`${m.confidence_percent.toFixed(2)}%`}
          />
          <MetricRow
            label="Latency"
            value={`${m.latency_ms.toFixed(3)} ms`}
          />
          <MetricRow
            label="Risk Score"
            value={m.risk_score.toFixed(4)}
          />
        </div>
      ))}

      {/* CONFUSION MATRICES */}
      {selectedModel === "ALL" &&
        chartData.map((m) => (
          <ConfusionMatrix
            key={m.model}
            data={{
              model: m.model,
              matrix: mnistData[m.model]?.evaluation?.confusion_matrix ?? [],
              FAR: mnistData[m.model]?.evaluation?.FAR,
              FRR: mnistData[m.model]?.evaluation?.FRR,
              risk_score: m.risk_score,
            }}
          />
        ))}
    </div>
  )
}

/* ================= COMPONENTS ================= */

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
      <p className="text-xs">
        Accuracy: {model.confidence_percent.toFixed(2)}%
      </p>
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
