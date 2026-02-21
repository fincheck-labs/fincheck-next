"use client"

import { useRef, useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function BankingDemoPage() {
  const [typedText, setTypedText] = useState("")
  const [verifyResult, setVerifyResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  /* ===============================
     Live Ambiguity Detection
  =============================== */
  const ambiguousChars = ["o", "O", "l", "I"]

  const ambiguityIssues = useMemo(() => {
    const issues: { index: number; char: string }[] = []
    for (let i = 0; i < typedText.length; i++) {
      if (ambiguousChars.includes(typedText[i])) {
        issues.push({ index: i, char: typedText[i] })
      }
    }
    return issues
  }, [typedText])

  /* ===============================
     Canvas Render Preview
  =============================== */
  useEffect(() => {
    if (!typedText) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = 400
    canvas.height = 120

    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = "black"
    ctx.font = "64px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(typedText, canvas.width / 2, canvas.height / 2)
  }, [typedText])

  /* ===============================
     Verify API Call
  =============================== */
  async function verifyTypedText() {
    if (!typedText.trim()) return

    const canvas = canvasRef.current
    if (!canvas) return

    setLoading(true)
    setVerifyResult(null)

    canvas.toBlob(async (blob) => {
      if (!blob) return

      const formData = new FormData()
      formData.append("image", blob, "typed.png")
      formData.append("raw_text", typedText)

      const res = await fetch("/api/verify", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      setVerifyResult(data)
      setLoading(false)
    }, "image/png")
  }

  const verdictColor = (verdict: string) =>
    verdict === "VALID_TYPED_TEXT"
      ? "text-emerald-700 bg-emerald-100"
      : "text-red-700 bg-red-100"

  /* ===============================
     UI
  =============================== */

  return (
    <main className="min-h-screen bg-slate-50 py-16 px-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-slate-900">
            Banking-Grade OCR Risk Validation Engine
          </h1>
          <p className="text-slate-600 mt-3">
            Real-time character ambiguity detection & confidence scoring
          </p>
        </div>

        {/* Input Card */}
        <div className="relative bg-white rounded-3xl shadow-xl border p-10">

          {loading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center rounded-3xl z-10">
              <div className="animate-spin h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
            </div>
          )}

          <div className="max-w-md mx-auto">

            <input
              type="text"
              value={typedText}
              maxLength={20}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9a-zA-Z]/g, "")
                setTypedText(value)
              }}
              placeholder="Type e.g. 703, 7o3, 1l9..."
              className="w-full px-5 py-4 text-lg border-2 border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 focus:shadow-lg transition-all duration-300 text-center font-mono tracking-wider"
            />

            <div className="text-right text-sm text-slate-400 mt-1">
              {typedText.length}/20
            </div>

            {/* Ambiguity Warning */}
            {ambiguityIssues.length > 0 && (
              <div className="mt-4 text-amber-600 text-sm text-center font-medium">
                ⚠ Potential OCR ambiguity detected at position(s):{" "}
                {ambiguityIssues.map((i) => i.index + 1).join(", ")}
              </div>
            )}

            {/* Example Buttons */}
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {["703", "7o3", "1l9", "Il1"].map((ex) => (
                <button
                  key={ex}
                  onClick={() => setTypedText(ex)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-mono text-sm transition"
                >
                  {ex}
                </button>
              ))}
            </div>

            <button
              onClick={verifyTypedText}
              disabled={!typedText.trim() || loading}
              className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-semibold py-4 rounded-2xl transition-all"
            >
              Verify Typed Text
            </button>

            {/* Canvas Preview */}
            <div className="mt-8 flex justify-center">
              <canvas
                ref={canvasRef}
                className="rounded-xl shadow-md border bg-white"
              />
            </div>
          </div>
        </div>

        {/* Results Section */}
        <AnimatePresence>
          {verifyResult && (
            <motion.section
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-12 bg-white p-10 rounded-3xl shadow-xl border"
            >
              <h2 className="text-2xl font-bold mb-6">
                Verification Result
              </h2>

              <div className="mb-4">
                <span className={`px-4 py-2 rounded-xl font-bold ${verdictColor(verifyResult.verdict)}`}>
                  {verifyResult.verdict}
                </span>
              </div>

              <div className="mb-6">
                Final Output:{" "}
                <code className="bg-slate-100 px-3 py-1 rounded font-bold">
                  {verifyResult.final_output}
                </code>
              </div>

              {/* Confidence Bar */}
              {verifyResult.confidence !== undefined && (
                <div className="mb-8">
                  <div className="text-sm font-medium mb-2">
                    Confidence: {(verifyResult.confidence * 100).toFixed(1)}%
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className="bg-emerald-500 h-3 rounded-full transition-all duration-700"
                      style={{
                        width: `${verifyResult.confidence * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Errors */}
              {verifyResult.errors?.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-red-700">
                    Character Errors Detected
                  </h3>
                  {verifyResult.errors.map((e: any, i: number) => (
                    <div
                      key={i}
                      className="p-4 border border-red-200 rounded-xl bg-red-50 font-mono"
                    >
                      Position {e.position} → Typed:{" "}
                      <span className="font-bold text-red-700">
                        {e.typed_char}
                      </span>{" "}
                      | OCR:{" "}
                      <span className="font-bold text-red-700">
                        {e.ocr_char}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Explanation */}
              {verifyResult.why && (
                <div className="mt-8 p-4 bg-slate-100 rounded-xl">
                  <h4 className="font-semibold mb-2">Explanation</h4>
                  <p className="text-slate-700">{verifyResult.why}</p>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}