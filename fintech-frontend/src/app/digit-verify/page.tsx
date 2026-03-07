"use client"

import { AlertCircle, Brain, CheckCircle, Crop, Image, Loader2, Upload, Zap } from "lucide-react"
import { useRef, useState } from "react"

export default function DigitVerifyPage() {
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState("")
  const [fileSize, setFileSize] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [threshold, setThreshold] = useState(70)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ================= STATUS COLOR ================= */
  function statusColor(status?: string) {
    if (!status) return "text-gray-500"
    if (status === "VALID") return "text-emerald-600 font-bold"
    if (status === "AMBIGUOUS") return "text-amber-600 font-bold"
    return "text-red-600 font-bold"
  }

  /* ================= CONFIDENCE HEAT COLOR ================= */
  function confidenceColor(conf?: number) {
    if (conf === undefined) return "text-gray-500"
    if (conf >= threshold + 5) return "text-emerald-700 font-bold"
    if (conf >= threshold) return "text-emerald-600"
    if (conf >= threshold - 5) return "text-amber-600"
    return "text-red-600"
  }

  /* ================= FILE SIZE FORMATTER ================= */
  function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
      const res = await fetch("http://localhost:8000/verify-digit-only", {
        method: "POST",
        body: fd
      })
      const data = await res.json()
      setResult(data)
    } catch (error) {
      alert("Verification failed. Please check your backend server.")
      console.error("Verification error:", error)
    } finally {
      setLoading(false)
    }
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
      // File validation
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      const maxSize = 10 * 1024 * 1024 // 10MB

      if (!validTypes.includes(selectedFile.type)) {
        alert("Please upload only JPG, PNG, or WebP images")
        e.target.value = ""
        return
      }

      if (selectedFile.size > maxSize) {
        alert(`File too large. Max 10MB (${formatFileSize(maxSize)})`)
        e.target.value = ""
        return
      }

      setFile(selectedFile)
      setFileName(selectedFile.name)
      setFileSize(formatFileSize(selectedFile.size))
      setResult(null)
    }

    // Reset input
    e.target.value = ""
  }

  const removeFile = () => {
    setFile(null)
    setFileName("")
    setFileSize("")
    setResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-emerald-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center pt-8 pb-12">
          <div className="inline-flex items-center gap-4 bg-white/90 backdrop-blur-xl px-8 py-6 rounded-3xl shadow-2xl border border-white/60 mb-8">
            <div className="p-4 bg-linear-to-r from-emerald-500 to-blue-600 rounded-2xl shadow-lg">
              <Zap className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black bg-linear-to-r from-slate-900 via-gray-800 to-slate-700 bg-clip-text text-transparent leading-tight">
                Image Verification
              </h1>
              <p className="text-lg md:text-xl text-slate-600 mt-2 font-medium">Image digit verification with confidence analysis</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left Column - Upload & Controls */}
          <div className="space-y-6">
            {/* Upload Area */}
            <div className="relative">
              <div
                className={`w-full p-10 border-4 border-dashed rounded-3xl text-center transition-all duration-300 hover:shadow-2xl group bg-white/80 backdrop-blur-xl ${file
                  ? "border-emerald-400 bg-emerald-50/80 shadow-xl ring-4 ring-emerald-100/50"
                  : "border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/60 hover:shadow-emerald-100/50"
                  }`}
              >
                <div className="flex flex-col items-center gap-6 pointer-events-none">
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg transition-all duration-300 ring-4 ring-white/50 ${file
                    ? "bg-emerald-500/90 text-white shadow-emerald-500/25 scale-110"
                    : "bg-linear-to-br from-emerald-500 to-blue-500 text-white hover:scale-110 shadow-blue-500/25"
                    }`}>
                    {file ? (
                      <CheckCircle className="w-12 h-12 drop-shadow-lg" />
                    ) : (
                      <Upload className="w-12 h-12 drop-shadow-lg" />
                    )}
                  </div>

                  {file ? (
                    <div className="space-y-2">
                      <p className="font-bold text-xl text-emerald-700 drop-shadow-sm">
                        ✅ {fileName}
                      </p>
                      <p className="text-sm text-emerald-600 font-mono bg-emerald-100/80 px-3 py-1 rounded-full">
                        {fileSize}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-bold text-xl text-slate-800 group-hover:text-emerald-700 transition-colors">
                        Click or drag  image to upload
                      </p>
                      <p className="text-lg text-slate-500">PNG, JPG, WebP up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-3xl z-20"
                disabled={loading}
              />
            </div>

            {/* File Actions */}
            {file && (
              <div className="flex gap-3 bg-white/80 backdrop-blur-xl p-4 rounded-2xl shadow-lg border border-white/50">
                <button
                  onClick={removeFile}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-semibold hover:shadow-md transition-all border border-red-200/50"
                >
                  <AlertCircle className="w-5 h-5 inline mr-2" />
                  Remove Image
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold hover:shadow-md transition-all border border-slate-200/50"
                  disabled={loading}
                >
                  <Image className="w-5 h-5 inline mr-2" />
                  Change Image
                </button>
              </div>
            )}

            {/* Confidence Slider */}
            <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/60">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-5 h-5 bg-linear-to-r from-emerald-500 to-blue-500 rounded-2xl shadow-lg ring-2 ring-white" />
                <h3 className="text-2xl font-bold bg-linear-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Confidence Threshold
                </h3>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between text-sm font-mono text-slate-600 tracking-wide">
                  <span className="font-bold text-slate-800">Strict</span>
                  <span className="text-2xl font-bold text-slate-900 drop-shadow-sm">{threshold}%</span>
                  <span className="font-bold text-slate-800">Lenient</span>
                </div>

                <input
                  type="range"
                  min={50}
                  max={100}
                  step={1}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full h-3 bg-linear-to-r from-slate-200 to-slate-300 rounded-2xl appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-600 shadow-inner transition-all duration-300"
                />

                <div className="grid grid-cols-2 gap-4 text-xs bg-linear-to-r from-emerald-50 to-amber-50 p-4 rounded-2xl border border-emerald-100/50">
                  <div className="text-emerald-700 font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Accept: {threshold}%+
                  </div>
                  <div className="text-amber-700 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Ambiguous: {threshold - 5}%–{threshold}%
                  </div>
                </div>
              </div>
            </div>

            {/* Verify Button */}
            <button
              onClick={verify}
              disabled={!file || loading}
              className={`group w-full py-5 px-8 rounded-3xl font-bold text-xl shadow-2xl transition-all duration-300 flex items-center justify-center gap-4 transform hover:-translate-y-2 active:translate-y-0 ${!file || loading
                ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border-2 border-slate-200"
                : "bg-linear-to-r from-emerald-600 via-emerald-500 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white hover:shadow-3xl hover:shadow-emerald-500/25 hover:ring-4 ring-emerald-500/30"
                }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin group-hover:animate-spin-slow" />
                  <span>Analyzing Digits...</span>
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span>Verify Image Digits</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {result && (
              <>
                {/* Verdict Card */}
                <div className={`p-10 rounded-3xl shadow-2xl border-8 transition-all duration-700 group hover:shadow-3xl ${result.verdict === "VALID"
                  ? "bg-linear-to-br from-emerald-50 to-emerald-25 border-emerald-300 ring-4 ring-emerald-200/50"
                  : result.verdict === "AMBIGUOUS"
                    ? "bg-linear-to-br from-amber-50 to-amber-25 border-amber-300 ring-4 ring-amber-200/50"
                    : "bg-linear-to-br from-red-50 to-red-25 border-red-300 ring-4 ring-red-200/50"
                  }`}>
                  <div className="flex items-start gap-6">
                    {result.verdict === "VALID" && (
                      <CheckCircle className="w-20 h-20 text-emerald-500 drop-shadow-2xl shrink-0 mt-1" />
                    )}
                    {result.verdict === "AMBIGUOUS" && (
                      <AlertCircle className="w-20 h-20 text-amber-500 drop-shadow-2xl shrink-0 mt-1" />
                    )}
                    {result.verdict !== "VALID" && result.verdict !== "AMBIGUOUS" && (
                      <AlertCircle className="w-20 h-20 text-red-500 drop-shadow-2xl shrink-0 mt-1" />
                    )}

                    <div className="flex-1 space-y-4">
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight">Final Verdict</h2>
                      <p className={`text-5xl font-black uppercase tracking-widest ${statusColor(result.verdict)}`}>
                        {result.verdict}
                      </p>
                      <p className="text-4xl font-mono font-bold text-slate-800 bg-slate-100 px-6 py-3 rounded-2xl shadow-inner">
                        {result.digits || "????"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pipeline Preview */}
                {result.preview && (
                  <div className="bg-white/90 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl border border-white/70">
                    <h4 className="font-black text-2xl mb-8 text-slate-900 flex items-center gap-3">
                      <Brain className="w-8 h-8 text-emerald-600" />
                      Processing Pipeline
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {[
                        { src: result.preview.original, title: "Original", desc: "Uploaded cheque", icon: Image },
                        { src: result.preview.cropped, title: "Cropped", desc: "Digit region extracted", icon: Crop },
                        { src: result.preview.normalized, title: "28×28 Normalized", desc: "AI model input", icon: Brain }
                      ].map((img, i) => (
                        <div key={i} className="group hover:scale-[1.05] transition-all duration-300 hover:shadow-2xl">
                          <div className="bg-linear-to-br from-slate-50 to-white p-6 rounded-2xl border-2 border-slate-100 hover:border-emerald-200 group-hover:shadow-xl transition-all">
                            <div className="w-full h-48 flex items-center justify-center bg-slate-50 rounded-xl overflow-hidden shadow-inner">
                              <img
                                src={imgSrc(img.src)}
                                className="w-full h-full object-contain"
                                alt={img.title}
                              />
                            </div>
                          </div>
                          <div className="text-center mt-4">
                            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full font-bold text-sm shadow-md">
                              <img.icon className="w-4 h-4" />
                              {img.title}
                            </div>
                            <p className="text-sm text-slate-600 mt-2">{img.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Per-Digit Analysis */}
                {result.analysis?.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-black text-2xl text-slate-900 flex items-center gap-3">
                      <Image className="w-9 h-9" />
                      Digit-by-Digit Analysis
                    </h4>
                    <div className="space-y-4">
                      {result.analysis.map((a: any) => (
                        <div
                          key={a.position}
                          className={`group p-8 rounded-3xl shadow-xl border-4 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer ${a.status === "VALID"
                            ? "bg-emerald-50 border-emerald-300 hover:border-emerald-400 hover:shadow-emerald-200/50"
                            : a.status === "AMBIGUOUS"
                              ? "bg-amber-50 border-amber-300 hover:border-amber-400 hover:shadow-amber-200/50"
                              : "bg-red-50 border-red-300 hover:border-red-400 hover:shadow-red-200/50"
                            }`}
                        >
                          <div className="flex items-start gap-6">
                            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black shadow-2xl shrink-0 ring-4 ring-white/50 ${a.status === "VALID" ? "bg-emerald-500 text-white shadow-emerald-500/30" :
                              a.status === "AMBIGUOUS" ? "bg-amber-500 text-white shadow-amber-500/30" :
                                "bg-red-500 text-white shadow-red-500/30"
                              }`}>
                              {a.position}
                            </div>
                            <div className="space-y-3 flex-1 pt-2">
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-xl text-slate-800">Status:</span>
                                <span className={`px-4 py-2 rounded-xl font-bold text-lg shadow-md ${statusColor(a.status)}`}>
                                  {a.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-xl text-slate-800">Confidence:</span>
                                <span className={`text-2xl font-black ${confidenceColor(a.confidence)}`}>
                                  {a.confidence}%
                                </span>
                              </div>
                              {a.possible_values?.length > 0 && (
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-lg text-slate-700">Possible values:</span>
                                  <div className="flex gap-2 flex-wrap">
                                    {a.possible_values.map((val: string, i: number) => (
                                      <span
                                        key={i}
                                        className="bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl font-mono font-bold text-sm shadow-sm transition-all cursor-pointer"
                                      >
                                        {val}
                                      </span>
                                    ))}
                                  </div>
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
