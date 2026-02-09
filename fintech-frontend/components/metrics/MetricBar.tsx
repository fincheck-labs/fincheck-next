"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import GraphCard from "../charts/GraphCard"
import { ChartItem } from "../metrics/types"
import { METRIC_META } from "../metrics/metricMeta"

/* ---------------- DYNAMIC REASONING ---------------- */
function generateReasoning(
  metricLabel: string,
  values: { model: string; value: number }[],
  higherIsBetter: boolean
) {
  if (values.length === 0) return ""

  const sorted = [...values].sort((a, b) =>
    higherIsBetter ? b.value - a.value : a.value - b.value
  )

  const best = sorted[0]
  const avg =
    values.reduce((sum, v) => sum + v.value, 0) / values.length

  const delta = higherIsBetter
    ? best.value - avg
    : avg - best.value

  const percentGain =
    avg !== 0 ? (delta / avg) * 100 : 0

  const roundedBest = best.value.toFixed(2)
  const roundedAvg = avg.toFixed(2)
  const roundedDelta = delta.toFixed(2)
  const roundedPercent = percentGain.toFixed(1)

  if (Math.abs(percentGain) < 5) {
    return (
      `${best.model} records the best ${metricLabel.toLowerCase()} ` +
      `(${roundedBest}) compared to the group average (${roundedAvg}). ` +
      `Although the numerical difference is modest (${roundedDelta}, ~${roundedPercent}%), ` +
      `the model demonstrates consistent performance across evaluations.`
    )
  }

  if (Math.abs(percentGain) < 20) {
    return (
      `${best.model} achieves the highest ${metricLabel.toLowerCase()} ` +
      `(${roundedBest}), outperforming the average model (${roundedAvg}) ` +
      `by ${roundedDelta} (${roundedPercent}%). ` +
      `This indicates a clear and meaningful performance advantage.`
    )
  }

  return (
    `${best.model} shows a substantial improvement in ` +
    `${metricLabel.toLowerCase()}, reaching ${roundedBest} compared to ` +
    `the group average of ${roundedAvg}. ` +
    `The observed gain of ${roundedDelta} (${roundedPercent}%) ` +
    `highlights the model’s strong suitability for optimization with respect to this metric.`
  )
}


/* ---------------- COMPONENT ---------------- */

export default function MetricBar({
  dataKey,
  data,
  selectedModel,
}: {
  dataKey: keyof ChartItem
  data: ChartItem[]
  selectedModel: string
}) {
  const meta = METRIC_META[dataKey]

  // Sort to determine best model
  const sorted = [...data].sort((a, b) => {
    const va = a[dataKey] as number
    const vb = b[dataKey] as number
    return meta.higherIsBetter ? vb - va : va - vb
  })

  const bestModel = sorted[0]?.model

  // Build reasoning input
  const values = data.map((d) => ({
    model: d.model,
    value: d[dataKey] as number,
  }))

  const reasoning = generateReasoning(
    meta.label,
    values,
    meta.higherIsBetter
  )

  return (
    <GraphCard
      title={meta.label}
      description={meta.description}
      userHint={meta.userHint}
      bestLabel={bestModel}
      bestReason={
        meta.higherIsBetter
          ? `Highest ${meta.label}`
          : `Lowest ${meta.label}`
      }
    >
      {/* 📊 BAR CHART */}
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <XAxis
            dataKey="model"
            angle={-15}
            textAnchor="end"
            interval={0}
            height={60}
          />
          <YAxis />
          <Tooltip />
          <Bar dataKey={dataKey as string}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={
                  selectedModel !== "ALL" &&
                  entry.model === selectedModel
                    ? "#22c55e"
                    : "#60a5fa"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* 🧠 DYNAMIC REASONING */}
      {reasoning && (
        <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
          <span className="font-medium text-gray-700">
            Why this model is best:
          </span>{" "}
          {reasoning}
        </div>
      )}
    </GraphCard>
  )
}