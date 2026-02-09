"use client"

export default function EvaluationModeSelector({
  mode,
  setMode,
}: {
  mode: "SINGLE" | "DATASET"
  setMode: (m: "SINGLE" | "DATASET") => void
}) {
  return (
    <div className="flex gap-4">
      <button
        onClick={() => setMode("SINGLE")}
        className={`rounded-lg px-4 py-2 text-sm font-medium border
          ${mode === "SINGLE"
            ? "bg-blue-600 text-white"
            : "bg-white text-gray-700"}`}
      >
        Single Image
      </button>

      <button
        onClick={() => setMode("DATASET")}
        className={`rounded-lg px-4 py-2 text-sm font-medium border
          ${mode === "DATASET"
            ? "bg-blue-600 text-white"
            : "bg-white text-gray-700"}`}
      >
        Dataset / ZIP
      </button>
    </div>
  )
}