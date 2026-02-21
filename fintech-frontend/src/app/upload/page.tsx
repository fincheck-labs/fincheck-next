"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import EvaluationModeSelector from "../../../components/EvaluationModeSelector"
import { PREBUILT_DATASETS } from "@/lib/dataset"

type Mode = "SINGLE" | "DATASET"

type DigitPattern = number[][]
const digitPatterns: Record<number, DigitPattern> = {
  0: [[0,1,1,0],[1,0,0,1],[1,0,0,1],[1,0,0,1],[0,1,1,0]],
  1: [[0,1,1],[1,0,0],[0,1,0],[0,1,0],[1,1,1]],
  2: [[1,1,0],[0,0,1],[1,1,0],[1,0,0],[1,1,1]],
  3: [[1,1,1],[0,0,1],[1,1,0],[0,0,1],[1,1,1]],
  4: [[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],
  5: [[1,1,1],[1,0,0],[1,1,0],[0,0,1],[1,1,1]],
  6: [[0,1,1],[1,0,0],[1,1,1],[1,0,1],[0,1,1]],
  7: [[1,1,1],[0,0,1],[0,1,0],[1,0,0],[1,0,0]],
  8: [[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1]],
  9: [[1,1,1],[1,0,1],[1,1,1],[0,0,1],[1,1,0]]
}

interface StressControlsProps {
  blur: number
  setBlur: (value: number) => void
  rotation: number
  setRotation: (value: number) => void
  noise: number
  setNoise: (value: number) => void
  erase: number
  setErase: (value: number) => void
}

interface StressSliderProps {
  label: string
  value: number
  setValue: (value: number) => void
  min: number
  max: number
  step?: number
  icon: string
  info: string
}

interface UploadAreaProps {
  file: File | null
  setFile: (file: File | null) => void
}

interface LivePreviewProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  title?: string
}

interface DatasetPreviewProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
}

export default function ConMatPage() {
  const router = useRouter()

  /* ================= MODE ================= */
  const [mode, setMode] = useState<Mode>("SINGLE")
  const [selectedDataset, setSelectedDataset] = useState<string>("MNIST_100")
  const [selectedDigit, setSelectedDigit] = useState<number>(0)

  /* ================= FILE ================= */
  const [file, setFile] = useState<File | null>(null)

  /* ================= DATASET PREVIEW ================= */
  const [datasetPreview, setDatasetPreview] = useState<(string | null)[]>([])

  /* ================= STRESS ================= */
  const [blur, setBlur] = useState(0)
  const [rotation, setRotation] = useState(0)
  const [noise, setNoise] = useState(0)
  const [erase, setErase] = useState(0)

  /* ================= UI ================= */
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [datasetLoading, setDatasetLoading] = useState(false)

  /* ================= PREVIEW ================= */
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const datasetCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // Single image preview
  useEffect(() => {
    if (!file || !canvasRef.current) return

    const img = new Image()
    img.src = URL.createObjectURL(file)

    img.onload = () => {
      const canvas = canvasRef.current!
      const ctx = canvas.getContext("2d")!

      canvas.width = img.width
      canvas.height = img.height

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()

      if (rotation !== 0) {
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate((rotation * Math.PI) / 180)
        ctx.translate(-canvas.width / 2, -canvas.height / 2)
      }

      ctx.filter = `blur(${blur}px)`
      ctx.drawImage(img, 0, 0)
      ctx.restore()

      if (noise > 0) {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imgData.data

        for (let i = 0; i < data.length; i += 4) {
          const n = (Math.random() - 0.5) * 255 * noise
          data[i] = Math.max(0, Math.min(255, data[i] + n))
          data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n))
          data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n))
        }
        ctx.putImageData(imgData, 0, 0)
      }

      if (erase > 0) {
        ctx.fillStyle = "black"
        ctx.fillRect(
          canvas.width * (1 - erase),
          canvas.height * (1 - erase),
          canvas.width * erase,
          canvas.height * erase
        )
      }
    }
  }, [file, blur, rotation, noise, erase])

  // 🔍 ENLARGED Dataset preview - 6x6 grid with 48x48 images
  useEffect(() => {
    if (mode !== "DATASET" || !datasetCanvasRef.current) return

    const canvas = datasetCanvasRef.current!
    const ctx = canvas.getContext("2d")!
    
    // 🎯 ENLARGED: 6x6 grid (36 samples), 48x48 images
    const GRID_SIZE = 6
    const IMAGE_SIZE = 48
    const SPACING = 12
    const TOTAL_SIZE = GRID_SIZE * IMAGE_SIZE + (GRID_SIZE - 1) * SPACING

    canvas.width = TOTAL_SIZE
    canvas.height = TOTAL_SIZE
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = "#f8fafc"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw enlarged grid of sample digits with stress effects
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const x = col * (IMAGE_SIZE + SPACING)
        const y = row * (IMAGE_SIZE + SPACING)
        
        ctx.save()
        ctx.translate(x + IMAGE_SIZE / 2, y + IMAGE_SIZE / 2)
        
        // Random rotation within range
        const randRotation = (Math.random() - 0.5) * rotation * 2
        ctx.rotate((randRotation * Math.PI) / 180)
        
        // Apply blur (scaled for larger images)
        ctx.filter = `blur(${blur * 0.5}px)`
        drawDigit(ctx, (row * GRID_SIZE + col) % 10, IMAGE_SIZE)
        
        // Add noise
        if (noise > 0) {
          const imgData = ctx.getImageData(-IMAGE_SIZE / 2, -IMAGE_SIZE / 2, IMAGE_SIZE, IMAGE_SIZE)
          const data = imgData.data
          for (let i = 0; i < data.length; i += 4) {
            const n = (Math.random() - 0.5) * 120 * noise
            data[i] = Math.max(0, Math.min(255, data[i] + n))
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n))
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n))
          }
          ctx.putImageData(imgData, -IMAGE_SIZE / 2, -IMAGE_SIZE / 2)
        }
        
        // Erase corner
        if (erase > 0) {
          ctx.fillStyle = "#1e293b"
          ctx.fillRect(
            IMAGE_SIZE * (1 - erase) - IMAGE_SIZE / 2,
            IMAGE_SIZE * (1 - erase) - IMAGE_SIZE / 2,
            IMAGE_SIZE * erase,
            IMAGE_SIZE * erase
          )
        }
        
        ctx.restore()
      }
    }
  }, [mode, selectedDataset, blur, rotation, noise, erase])

  function drawDigit(ctx: CanvasRenderingContext2D, digit: number, size: number) {
    ctx.save()
    ctx.translate(-size / 2, -size / 2)
    
    // MNIST-like grayscale background
    const gradient = ctx.createLinearGradient(0, 0, size, size)
    gradient.addColorStop(0, "#f1f5f9")
    gradient.addColorStop(1, "#e2e8f0")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
    
    ctx.shadowColor = "rgba(0,0,0,0.3)"
    ctx.shadowBlur = 3
    ctx.shadowOffsetX = 1
    ctx.shadowOffsetY = 1
    
    const pattern = digitPatterns[digit] || digitPatterns[0]
    const cellSize = size / 20
    
    for (let y = 0; y < pattern.length; y++) {
      for (let x = 0; x < pattern[y].length; x++) {
        if (pattern[y][x]) {
          const gradient = ctx.createRadialGradient(
            size * 0.1 + x * cellSize + cellSize / 2,
            size * 0.1 + y * cellSize * 1.5 + cellSize / 2,
            0,
            size * 0.1 + x * cellSize + cellSize / 2,
            size * 0.1 + y * cellSize * 1.5 + cellSize / 2,
            cellSize * 1.2
          )
          gradient.addColorStop(0, "#1e40af")
          gradient.addColorStop(1, "#1e3a8a")
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(
            size * 0.1 + x * cellSize + cellSize / 2,
            size * 0.1 + y * cellSize * 1.5 + cellSize / 2,
            cellSize * 0.9,
            0,
            Math.PI * 2
          )
          ctx.fill()
        }
      }
    }
    
    ctx.restore()
  }

  async function runInference() {
    setLoading(true)
    setError(null)

    const form = new FormData()
    let endpoint = ""

    if (mode === "SINGLE") {
      if (!file) {
        setError("Upload image")
        setLoading(false)
        return
      }
      form.append("image", file)
      form.append("expected_digit", selectedDigit.toString())
      endpoint = "/api/run"
    } else {
      endpoint = "/api/run-dataset"
      form.append("dataset_name", selectedDataset)
    }

    form.append("blur", String(blur))
    form.append("rotation", String(rotation))
    form.append("noise", String(noise))
    form.append("erase", String(erase))

    try {
      const res = await fetch(endpoint, { method: "POST", body: form })
      const json = await res.json()

      const id = json.id || json.result_id
      if (!id) throw new Error()

      router.push(`/results/${id}`)
    } catch {
      setError("Inference failed")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Robustness Testing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Real-time stress preview for single images and dataset samples
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Left Column */}
          <div className="space-y-8">
            <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl p-8 shadow-xl">
              <EvaluationModeSelector mode={mode} setMode={setMode} />
            </div>

            {mode === "SINGLE" && (
              <div className="space-y-6">
                <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-xl">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Expected Digit</label>
                  <select
                    value={selectedDigit}
                    onChange={(e) => setSelectedDigit(Number(e.target.value))}
                    className="w-full p-4 border border-gray-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg"
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <UploadArea file={file} setFile={setFile} />
                {file && <LivePreview canvasRef={canvasRef} title="Single Image Preview" />}
              </div>
            )}

            {mode === "DATASET" && (
              <div className="space-y-6">
                <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-xl">
                  <label className="block text-sm font-semibold text-gray-700 mb-4">Select Dataset</label>
                  <select
                    value={selectedDataset}
                    onChange={(e) => setSelectedDataset(e.target.value)}
                    className="w-full p-4 border border-gray-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg"
                  >
                    {PREBUILT_DATASETS.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
                {/* 🎯 ENLARGED Dataset Preview */}
                <DatasetPreview canvasRef={datasetCanvasRef} />
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6 lg:sticky lg:top-8 lg:h-fit">
            <StressControlsCard
              blur={blur}
              setBlur={setBlur}
              rotation={rotation}
              setRotation={setRotation}
              noise={noise}
              setNoise={setNoise}
              erase={erase}
              setErase={setErase}
            />
            <div className="pt-4">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              )}
              <button
                onClick={runInference}
                disabled={loading || (mode === "SINGLE" && !file)}
                className="w-full group bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-5 px-6 rounded-2xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 text-lg disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Running Robustness Test...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Run Robustness Test
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Reusable components (unchanged)
function UploadArea({ file, setFile }: UploadAreaProps) {
  return (
    <label className="group relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 shadow-xl hover:shadow-2xl bg-linear-to-b from-white/70 to-blue-50/50 backdrop-blur-sm">
      <input
        type="file"
        accept="image/*"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-800 mb-1">{file ? file.name : "Click or drag image"}</p>
          {file ? <p className="text-sm text-green-600 font-medium">✓ File selected</p> : <p className="text-sm text-gray-500">PNG, JPG, WebP up to 10MB</p>}
        </div>
      </div>
      {file && (
        <button onClick={(e) => {e.stopPropagation(); setFile(null)}} className="absolute top-3 right-3 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 opacity-0 group-hover:opacity-100">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      )}
    </label>
  )
}

function LivePreview({ canvasRef, title = "Live Preview" }: LivePreviewProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        <p className="text-sm font-semibold text-gray-700">{title}</p>
      </div>
      <div className="flex justify-center">
        <canvas ref={canvasRef} className="border-2 border-gray-200 rounded-xl shadow-lg max-h-80 w-auto max-w-full" />
      </div>
    </div>
  )
}

// 🎯 ENLARGED DatasetPreview Component
function DatasetPreview({ canvasRef }: DatasetPreviewProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl p-8 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-4 h-4 bg-purple-400 rounded-full animate-pulse" />
        <p className="text-lg font-semibold text-gray-700">Dataset Preview (6x6 Sample - 36 Images)</p>
      </div>
      <div className="flex justify-center">
        <canvas 
          ref={canvasRef} 
          className="border-4 border-gray-200 rounded-2xl shadow-2xl max-h-125 w-auto max-w-full cursor-zoom-in hover:shadow-3xl transition-all duration-300"
        />
      </div>
      <p className="text-sm text-gray-500 mt-4 text-center font-medium">
        🔍 48×48px MNIST-style digits with real-time stress effects (blur, rotation, noise, erase)
      </p>
    </div>
  )
}

function StressControlsCard({ blur, setBlur, rotation, setRotation, noise, setNoise, erase, setErase }: StressControlsProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl p-8 shadow-xl lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto">
      <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-200">
        <div className="w-8 h-8 bg-linear-to-r from-red-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg" />
        <h2 className="text-2xl font-bold bg-linear-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Robustness Controls</h2>
      </div>
      <div className="space-y-6">
        <StressSlider label="Blur (px)" value={blur} setValue={setBlur} min={0} max={15} step={0.5} icon="blur" info="0-15px Gaussian blur" />
        <StressSlider label="Rotation (°)" value={rotation} setValue={setRotation} min={-30} max={30} step={1} icon="rotate" info="±30° rotation" />
        <StressSlider label="Noise" value={noise} setValue={setNoise} min={0} max={1.5} step={0.05} icon="noise" info="0-1.5 intensity Gaussian noise" />
        <StressSlider label="Erase (%)" value={erase} setValue={setErase} min={0} max={0.6} step={0.05} icon="erase" info="0-60% bottom-right corner erase" />
      </div>
    </div>
  )
}

function StressSlider({ label, value, setValue, min, max, step = 1, icon, info }: StressSliderProps) {
  const icons: Record<string, string> = {
    blur: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z",
    rotate: "M4 4v5h.582m15.356 2A1 1 0 0020 15.5M15.707 3.293a1 1 0 00-1.414 0l-1.414 1.414a1 1 0 001.414 1.414l1.414-1.414a1 1 0 010-1.414zM5.757 17.293a1 1 0 01-1.414 0l-1.414-1.414a1 1 0 011.414-1.414l1.414 1.414a1 1 0 010 1.414zM15 11a3 3 0 11-6 0 3 3 0 016 0z",
    noise: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z",
    erase: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
  }

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-linear-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[icon] || icons.blur} />
            </svg>
          </div>
          <span className="font-semibold text-gray-800 text-lg">{label}</span>
        </div>
        <span className="font-mono text-sm font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-700 min-w-16 text-center shadow-sm">
          {value.toFixed(step < 0.1 ? 2 : 1)}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-2 pl-13">{info}</p>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500 transition-all duration-200 shadow-md hover:shadow-lg group-hover:shadow-xl"
      />
    </div>
  )
}
