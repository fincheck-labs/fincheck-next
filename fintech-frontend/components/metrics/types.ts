export type ChartItem = {
  model: string
  confidence_percent: number
  confidence_std: number
  latency_ms: number
  latency_std: number
  entropy: number
  entropy_std: number
  stability: number
  stability_std: number
  ram_delta_mb: number
  risk_score?: number   // 👈 add this
}
