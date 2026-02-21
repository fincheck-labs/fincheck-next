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
    if (verdict === "VALID_TYPED_TEXT") return "text-emerald-600 bg-emerald-50"
    return "text-red-600 bg-red-50"
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-xl border border-white/50 mb-6">
            <div className="w-12 h-12 bg-linear-to-r from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold bg-linear-to-r from-gray-900 via-gray-700 to-slate-800 bg-clip-text text-transparent">
                Banking OCR Demo
              </h1>
              <p className="text-lg text-slate-600 mt-2 font-medium">Character Error Detection</p>
            </div>
          </div>
          <p className="text-xl text-slate-700 max-w-2xl mx-auto leading-relaxed">
            Test how banking systems detect OCR errors in handwritten/typed numbers like <code className="bg-slate-200 px-2 py-1 rounded font-mono text-sm">703</code>, <code className="bg-slate-200 px-2 py-1 rounded font-mono text-sm">7o3</code>, <code className="bg-slate-200 px-2 py-1 rounded font-mono text-sm">1l9</code>
          </p>
        </div>

        {/* Input Section */}
        <section className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-10 mb-12">
          <div className="max-w-md mx-auto">
            <label className="block text-sm font-semibold text-slate-700 mb-4 text-center">
              Enter text to verify
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Type e.g. 703, 7o3, 1l9, Il1..."
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                className="w-full px-5 py-4 text-lg border-2 border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 bg-white/50 backdrop-blur-sm shadow-lg hover:shadow-xl font-mono tracking-wider text-center"
                maxLength={20}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                {typedText.length}/20
              </div>
            </div>
            
            <button
              onClick={verifyTypedText}
              disabled={loading || !typedText.trim()}
              className="w-full mt-6 bg-linear-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 text-lg disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Verify Typed Text
                </>
              )}
            </button>
          </div>
          <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
        </section>

        {/* Results Section */}
        {verifyResult && (
          <section className="animate-in slide-in-from-bottom-4 duration-500">
            <div className={`border-4 rounded-3xl p-8 shadow-2xl backdrop-blur-xl transition-all duration-500 ${
              verdictColor(verifyResult.verdict).includes('emerald') 
                ? 'border-emerald-200 bg-emerald-50/90' 
                : 'border-red-200 bg-red-50/90'
            }`}>
              <div className="flex items-start gap-4 mb-8">
                <div className={`p-4 rounded-2xl shadow-lg ${
                  verdictColor(verifyResult.verdict).includes('emerald') 
                    ? 'bg-emerald-500' 
                    : 'bg-red-500'
                }`}>
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    {verifyResult.verdict === "VALID_TYPED_TEXT" ? (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    )}
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Verification Complete</h2>
                  <p className="text-4xl font-black mb-1 tracking-tight">
                    <span className={`inline-block px-4 py-2 rounded-xl ${verdictColor(verifyResult.verdict)} shadow-lg`}>
                      {verifyResult.verdict}
                    </span>
                  </p>
                  <p className={`text-sm font-medium ${verdictColor(verifyResult.verdict).includes('emerald') ? 'text-emerald-700' : 'text-red-700'}`}>
                    Final Output: <code className="bg-white/50 px-3 py-1 rounded-xl font-bold text-lg">{verifyResult.final_output}</code>
                  </p>
                </div>
              </div>

              {verifyResult.errors?.length > 0 && (
                <div className="bg-white/60 border-2 border-red-200 rounded-2xl p-6 mb-6">
                  <h3 className="text-xl font-bold text-red-800 mb-4 flex items-center gap-2">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Character Errors Detected ({verifyResult.errors.length})
                  </h3>
                  <div className="grid gap-3">
                    {verifyResult.errors.map((e: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-red-50/50 border border-red-100 rounded-xl">
                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center font-bold text-red-600 text-lg">
                          {e.position}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-red-800">
                            Typed: <code className="bg-red-200 px-2 py-1 rounded font-bold">{e.typed_char}</code>
                          </div>
                          <div className="text-sm text-red-800">
                            OCR Read: <code className="bg-red-200 px-2 py-1 rounded font-bold">{e.ocr_char}</code>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {verifyResult.why && (
                <div className="bg-white/60 p-5 rounded-2xl border-l-4 border-emerald-400">
                  <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Explanation
                  </h4>
                  <p className="text-slate-700 leading-relaxed">{verifyResult.why}</p>
                </div>
              )}

              <div className="mt-8 pt-8 border-t border-slate-200">
                <button
                  onClick={() => {
                    setTypedText("")
                    setVerifyResult(null)
                  }}
                  className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-2 hover:bg-slate-100 px-4 py-2 rounded-xl transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear & Try Another
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
