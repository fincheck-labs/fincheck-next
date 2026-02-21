"use client"

import { useState, useRef } from "react"
import { Upload, Loader2, CheckCircle, AlertCircle, Zap } from "lucide-react"

export default function DigitVerifyPage() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [threshold, setThreshold] = useState(70)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ================= STATUS COLOR ================= */
  function statusColor(status?: string) {
    if (!status) return "text-gray-500"
    if (status === "VALID") return "text-green-600 font-semibold"
    if (status === "AMBIGUOUS") return "text-amber-600 font-semibold"
    return "text-red-600 font-semibold"
  }

  /* ================= CONFIDENCE HEAT COLOR ================= */
  function confidenceColor(conf?: number) {
    if (conf === undefined) return "text-gray-500"
    if (conf >= threshold + 5) return "text-emerald-700 font-semibold"
    if (conf >= threshold) return "text-emerald-600"
    if (conf >= threshold - 5) return "text-amber-600"
    return "text-red-600"
  }

  /* ================= API ================= */
  async function verify() {
    if (!file) return

    const fd = new FormData()
    fd.append("image", file)
    fd.append("confidence_threshold", String(threshold / 100))

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

  /* ================= FIXED FILE HANDLER ================= */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
    }
    // Reset input value to allow same file re-selection
    e.target.value = ""
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center pt-12 pb-8">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-xl border border-white/50 mb-6">
            <Zap className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-linear-to-rrom-gray-900 to-slate-700 bg-clip-text text-transparent">
                Cheque Digit Validator
              </h1>
              <p className="text-sm text-slate-600 mt-1">AI-powered cheque digit verification</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Left Column - Upload & Controls */}
          <div className="space-y-6">
            {/* ✅ FIXED Upload Area - SINGLE file picker */}
            <div className="relative">
              {/* Visual container - NO onClick */}
              <div 
                className={`w-full p-8 border-2 border-dashed rounded-2xl text-center transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group ${
                  file 
                    ? "border-emerald-300 bg-emerald-50/50" 
                    : "border-slate-200 hover:border-blue-300 bg-white/50 hover:bg-blue-50/50"
                }`}
              >
                <div className="flex flex-col items-center gap-4 pointer-events-none">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                    file 
                      ? "bg-emerald-100 text-emerald-600" 
                      : "bg-blue-100 text-blue-600 group-hover:bg-blue-200"
                  }`}>
                    {file ? (
                      <CheckCircle className="w-8 h-8" />
                    ) : (
                      <Upload className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <p className={`font-semibold text-lg transition-colors ${
                      file ? "text-emerald-700" : "text-slate-700 group-hover:text-blue-700"
                    }`}>
                      {file ? `✅ ${file.name}` : "Click to upload cheque image"}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">PNG, JPG, or any image format</p>
                  </div>
                </div>
              </div>
              
              {/* 👈 SINGLE input - Full coverage, NO double trigger */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-2xl z-10"
                disabled={loading}
              />
            </div>

            {/* Confidence Slider */}
            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-linear-to-rrom-emerald-500 to-blue-500 rounded-full ring-2 ring-white/50" />
                <h3 className="font-semibold text-lg text-slate-800">Confidence Threshold</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Strict</span>
                  <span className="font-mono font-semibold text-slate-900">{threshold}%</span>
                  <span>Lenient</span>
                </div>
                
                <input
                  type="range"
                  min={50}
                  max={100}
                  step={1}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-600 transition-all duration-200"
                />
                
                <div className="flex justify-between text-xs bg-slate-100/50 px-3 py-2 rounded-xl">
                  <span className="text-amber-600 font-medium">⚠️ Ambiguous: {threshold - 5}%–{threshold}%</span>
                  <span>✅ Accept: {threshold}%+</span>
                </div>
              </div>
            </div>

            {/* Verify Button */}
            <button
              onClick={verify}
              disabled={!file || loading}
              className={`w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-xl ${
                !file || loading
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  : "bg-linear-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 transform"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Verify Cheque
                </>
              )}
            </button>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {result && (
              <>
                {/* Verdict Card */}
                <div className={`p-8 rounded-2xl shadow-2xl border-4 transition-all duration-500 ${
                  result.verdict === "VALID" 
                    ? "bg-emerald-50 border-emerald-200" 
                    : result.verdict === "AMBIGUOUS"
                    ? "bg-amber-50 border-amber-200" 
                    : "bg-red-50 border-red-200"
                }`}>
                  <div className="flex items-start gap-4">
                    {result.verdict === "VALID" && <CheckCircle className="w-12 h-12 text-emerald-500 mt-0.5 shrink-0" />}
                    {result.verdict === "AMBIGUOUS" && <AlertCircle className="w-12 h-12 text-amber-500 mt-0.5 shrink-0" />}
                    {result.verdict !== "VALID" && result.verdict !== "AMBIGUOUS" && <AlertCircle className="w-12 h-12 text-red-500 mt-0.5 shrink-0" />}
                    
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-slate-900">Final Verdict</h3>
                      <p className={`${statusColor(result.verdict)} text-3xl font-black tracking-wide`}>
                        {result.verdict}
                      </p>
                      <p className="text-lg">
                        <span className="font-mono text-xl font-bold text-slate-800">{result.digits || "???"}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Image Previews */}
                {result.preview && (
                  <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50">
                    <h4 className="font-semibold text-lg mb-6 text-slate-800 flex items-center gap-2">
                      Processing Pipeline
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { src: result.preview.original, title: "Original", desc: "Uploaded image" },
                        { src: result.preview.cropped, title: "Cropped", desc: "Digit region extracted" },
                        { src: result.preview.normalized, title: "28×28 Normalized", desc: "AI model input" }
                      ].map((img, i) => (
                        <div key={i} className="group hover:scale-[1.02] transition-transform duration-200">
                          <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-100 hover:border-slate-200 group-hover:shadow-md transition-all">
                            <img 
                              src={imgSrc(img.src)} 
                              className="w-full h-32 md:h-40 object-contain mx-auto rounded-lg shadow-sm"
                              alt={img.title}
                            />
                          </div>
                          <p className="font-medium text-slate-800 mt-3 text-center">{img.title}</p>
                          <p className="text-xs text-slate-500 text-center">{img.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Per-Digit Analysis */}
                {result.analysis?.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-xl text-slate-800 flex items-center gap-2">
                      Digit-by-Digit Analysis
                    </h4>
                    <div className="space-y-3">
                      {result.analysis.map((a: any) => (
                        <div
                          key={a.position}
                          className={`p-6 rounded-2xl shadow-lg border transition-all hover:shadow-xl hover:-translate-y-1 group ${
                            a.status === "VALID" 
                              ? "bg-emerald-50 border-emerald-200 group-hover:border-emerald-300" 
                              : a.status === "AMBIGUOUS"
                              ? "bg-amber-50 border-amber-200 group-hover:border-amber-300"
                              : "bg-red-50 border-red-200 group-hover:border-red-300"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shrink-0 shadow-md ${
                              a.status === "VALID" ? "bg-emerald-100 text-emerald-700" :
                              a.status === "AMBIGUOUS" ? "bg-amber-100 text-amber-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {a.position}
                            </div>
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-800">Status:</span>
                                <span className={statusColor(a.status)}>{a.status}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-800">Confidence:</span>
                                <span className={confidenceColor(a.confidence)}>{a.confidence}%</span>
                              </div>
                              {a.possible_values?.length > 0 && (
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-sm font-medium text-slate-600">Possible:</span>
                                  <span className="font-mono bg-slate-100 px-2 py-1 rounded-lg text-sm text-slate-800">
                                    {a.possible_values.join(", ")}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
