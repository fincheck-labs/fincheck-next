export type ConfusionMatrixData = number[][]

export type ModelEvaluation = {
  confusion_matrix: ConfusionMatrixData
  FAR: number
  FRR: number
  risk_score: number
}

export type ModelRecord = {
  latency_ms?: number
  latency_mean?: number
  latency_std?: number

  confidence_percent?: number
  confidence_mean?: number
  confidence_std?: number

  entropy?: number
  entropy_mean?: number
  entropy_std?: number

  stability?: number
  stability_mean?: number
  stability_std?: number

  ram_mb: number

  evaluation: ModelEvaluation
}

export type ModelsMap = {
  [modelName: string]: ModelRecord
}

export type ConfusionMatrixModel = {
  model: string
  matrix: ConfusionMatrixData
  FAR?: number
  FRR?: number
  risk_score?: number
}
