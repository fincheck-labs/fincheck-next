"use client"

import { useState } from "react"

export default function DigitVerifyPage() {

  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [threshold, setThreshold] = useState(70)

  /* ================= STATUS COLOR ================= */

  function statusColor(status?: string) {
    if (!status) return "text-gray-500"
    if (status === "VALID") return "text-green-600"
    if (status === "AMBIGUOUS") return "text-yellow-600"
    return "text-red-600"
  }

  /* ================= CONFIDENCE HEAT COLOR ================= */

  function confidenceColor(conf?: number) {

    if (conf === undefined) return "text-gray-500"

    if (conf >= threshold + 5) return "text-green-800 font-semibold"
    if (conf >= threshold) return "text-green-600"
    if (conf >= threshold - 5) return "text-yellow-600"
    return "text-red-600"
  }

  /* ================= API ================= */

  async function verify() {

    if (!file) return

    const fd = new FormData()
    fd.append("image", file)

    // ⭐ Convert % → decimal for backend
    fd.append(
      "confidence_threshold",
      String(threshold / 100)
    )

    setLoading(true)
    setResult(null)

    try {

      const res = await fetch(
        "http://localhost:8000/verify-digit-only",
        { method: "POST", body: fd }
      )

      const data = await res.json()
      setResult(data)

    } catch {
      alert("Verification failed")
    }

    setLoading(false)
  }

  /* ================= IMAGE HELPER ================= */

  function imgSrc(b64?: string) {
    if (!b64) return ""
    return `data:image/png;base64,${b64}`
  }

  /* ================= UI ================= */

  return (
    <main className="p-10 max-w-4xl mx-auto space-y-6">

      <h1 className="text-2xl font-semibold">
        Cheque Digit Validation
      </h1>

      {/* Upload */}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          setFile(e.target.files?.[0] || null)
          setResult(null)
        }}
      />

      {/* ===== CONFIDENCE SLIDER ===== */}
      <div className="space-y-2">
        <p className="font-medium">
          Minimum Confidence to Accept
        </p>

        <input
          type="range"
          min={50}
          max={100}
          step={1}
          value={threshold}
          onChange={(e) =>
            setThreshold(Number(e.target.value))
          }
          className="w-full"
        />

        <p className="text-sm text-gray-600">
          {threshold}% Threshold
        </p>

        <p className="text-xs text-gray-400">
          Ambiguous zone: {threshold - 5}% – {threshold}%
        </p>
      </div>

      {/* Button */}
      <button
        onClick={verify}
        disabled={!file || loading}
        className="bg-black text-white px-4 py-2 rounded"
      >
        {loading ? "Checking..." : "Verify Image"}
      </button>

      {/* ================= RESULT ================= */}
      {result && (
        <div className="space-y-6">

          {/* ===== MAIN ===== */}
          <div className="bg-gray-100 p-4 rounded">
            <p>
              <b>Verdict:</b>{" "}
              <span className={statusColor(result.verdict)}>
                {result.verdict}
              </span>
            </p>

            <p>
              <b>Digits:</b> {result.digits || "???"}
            </p>
          </div>

          {/* ===== IMAGE PREVIEW ===== */}
          {result.preview && (
            <div className="grid grid-cols-3 gap-4">

              <div className="border p-2 rounded text-center">
                <p className="font-medium mb-2">Original</p>
                <img
                  src={imgSrc(result.preview.original)}
                  className="mx-auto"
                />
              </div>

              <div className="border p-2 rounded text-center">
                <p className="font-medium mb-2">Cropped</p>
                <img
                  src={imgSrc(result.preview.cropped)}
                  className="mx-auto"
                />
              </div>

              <div className="border p-2 rounded text-center">
                <p className="font-medium mb-2">
                  Normalized 28×28
                </p>
                <img
                  src={imgSrc(result.preview.normalized)}
                  className="mx-auto"
                />
              </div>

            </div>
          )}

          {/* ===== PER DIGIT ===== */}
          {result.analysis?.map((a: any) => (
            <div
              key={a.position}
              className="border p-3 rounded"
            >
              <p className="font-semibold">
                Position {a.position}
              </p>

              <p className={statusColor(a.status)}>
                Status: {a.status}
              </p>

              <p className={confidenceColor(a.confidence)}>
                Confidence: {a.confidence}%
              </p>

              {a.possible_values?.length > 0 && (
                <p className="text-sm text-gray-600">
                  Possible: {a.possible_values.join(", ")}
                </p>
              )}

            </div>
          ))}

        </div>
      )}

    </main>
  )
}