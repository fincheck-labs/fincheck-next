"use client"

import MetricBar from "../metrics/MetricBar"
import { ChartItem } from "../metrics/types"

export default function ChartSection({
  data,
  selectedModel,
}: {
  data: ChartItem[]
  selectedModel: string
}) {
  return (
    <div className="space-y-10 animate-fade-in">
      <MetricBar dataKey="confidence_percent" data={data} selectedModel={selectedModel} />
      <MetricBar dataKey="latency_ms" data={data} selectedModel={selectedModel} />
      <MetricBar dataKey="entropy" data={data} selectedModel={selectedModel} />
      <MetricBar dataKey="stability" data={data} selectedModel={selectedModel} />
      <MetricBar dataKey="ram_delta_mb" data={data} selectedModel={selectedModel} />
    </div>
  )
}