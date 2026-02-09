import type { ChartItem } from "./types"

export const METRIC_META: Record<
  keyof ChartItem,
  {
    label: string
    description: string
    userHint: string
    higherIsBetter: boolean
  }
> = {
  model: {
    label: "Model",
    description: "Model name or identifier.",
    userHint: "Shows which model produced the results.",
    higherIsBetter: true,
  },

  confidence_percent: {
    label: "Confidence (%)",
    description: "How sure the model is about its prediction.",
    userHint: "Higher confidence means the model is more certain.",
    higherIsBetter: true,
  },

  confidence_std: {
    label: "Confidence Std Dev",
    description: "Variation in confidence scores.",
    userHint: "Lower variation means more consistent confidence.",
    higherIsBetter: false,
  },

  latency_ms: {
    label: "Latency (ms)",
    description: "Time taken to process one image.",
    userHint: "Lower latency means faster responses.",
    higherIsBetter: false,
  },

  latency_std: {
    label: "Latency Std Dev (ms)",
    description: "Variation in processing time.",
    userHint: "Lower variation means more predictable performance.",
    higherIsBetter: false,
  },

  entropy: {
    label: "Prediction Uncertainty",
    description: "Measures how uncertain the model is.",
    userHint: "Lower uncertainty means clearer predictions.",
    higherIsBetter: false,
  },

  entropy_std: {
    label: "Entropy Std Dev",
    description: "Variation in prediction uncertainty.",
    userHint: "Lower values indicate more consistent certainty.",
    higherIsBetter: false,
  },

  stability: {
    label: "Prediction Stability",
    description: "Consistency of model outputs.",
    userHint: "Lower values mean steadier predictions.",
    higherIsBetter: false,
  },

  stability_std: {
    label: "Stability Std Dev",
    description: "Variation in prediction stability.",
    userHint: "Lower variation means more reliable behavior.",
    higherIsBetter: false,
  },

  ram_delta_mb: {
    label: "Memory Usage (MB)",
    description: "Extra memory used during inference.",
    userHint: "Lower memory usage is better for deployment.",
    higherIsBetter: false,
  },

  risk_score: {
    label: "Risk Score",
    description: "Overall risk derived from confidence, stability, and errors.",
    userHint: "Lower risk indicates a safer and more reliable model.",
    higherIsBetter: false,
  },
}
