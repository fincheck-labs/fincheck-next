"use client"

import { useRef, useState } from "react"

export default function BankingDemoPage() {
  const [typedText, setTypedText] = useState("")
  const [verifyResult, setVerifyResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  async function verifyTypedText() {
    if (!typedText.trim()) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    setLoading(true)
    setVerifyResult(null)

    canvas.width = 400
    canvas.height = 120

    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = "black"
    ctx.font = "64px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(typedText, canvas.width / 2, canvas.height / 2)

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

  function verdictColor(verdict: string) {
    if (verdict === "VALID_TYPED_TEXT") return "text-green-600"
    return "text-red-600"
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 space-y-8">
      <h1 className="text-3xl font-semibold">
        Banking OCR – Character Error Detection
      </h1>

      <section className="space-y-3">
        <input
          type="text"
          placeholder="Type e.g. 703, 7o3, 1l9"
          value={typedText}
          onChange={(e) => setTypedText(e.target.value)}
          className="border rounded-md px-3 py-2 w-64"
        />

        <button
          onClick={verifyTypedText}
          disabled={loading}
          className="ml-3 rounded-md bg-gray-900 px-4 py-2 text-white"
        >
          {loading ? "Verifying..." : "Verify Typed Text"}
        </button>

        <canvas ref={canvasRef} className="hidden" />
      </section>

      {verifyResult && (
        <div className="border rounded-md p-5 bg-gray-50 space-y-3">
          <p>
            <strong>Verdict:</strong>{" "}
            <span className={verdictColor(verifyResult.verdict)}>
              {verifyResult.verdict}
            </span>
          </p>

          <p>
            <strong>Final Output:</strong>{" "}
            {verifyResult.final_output}
          </p>

          {verifyResult.errors?.length > 0 && (
            <div className="mt-4 border border-red-300 bg-red-50 p-4">
              <h3 className="font-semibold text-red-700">
                Character Errors Detected
              </h3>
              <ul className="list-disc pl-5 text-sm text-red-700">
                {verifyResult.errors.map((e: any, i: number) => (
                  <li key={i}>
                    Position {e.position}: typed <b>{e.typed_char}</b>,
                    interpreted as <b>{e.ocr_char}</b>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {verifyResult.why && (
            <p className="text-sm text-gray-700">
              <b>Explanation:</b> {verifyResult.why}
            </p>
          )}
        </div>
      )}
    </main>
  )
}