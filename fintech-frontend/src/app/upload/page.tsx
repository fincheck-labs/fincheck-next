"use client"

  import { useState, useEffect, useRef } from "react"
  import { useRouter } from "next/navigation"
  import EvaluationModeSelector from "../../../components/EvaluationModeSelector"
  import { PREBUILT_DATASETS } from "@/lib/dataset"

  type Mode = "SINGLE" | "DATASET"
  type DatasetSource = "PREBUILT" | "CUSTOM"

  export default function ConMatPage() {

    const router = useRouter()

    /* ================= MODE ================= */

    const [mode, setMode] = useState<Mode>("SINGLE")
    const [datasetSource, setDatasetSource] =
      useState<DatasetSource>("PREBUILT")

    /* ================= DATA ================= */

    const [selectedDataset, setSelectedDataset] =
      useState<string>("MNIST_100")

    const [selectedDigit, setSelectedDigit] = useState<number>(0)

    /* ================= FILE ================= */

    const [file, setFile] = useState<File | null>(null)

    /* ================= STRESS ================= */

    const [blur, setBlur] = useState(0)
    const [rotation, setRotation] = useState(0)
    const [noise, setNoise] = useState(0)
    const [erase, setErase] = useState(0)

    /* ================= UI ================= */

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    /* ================= PREVIEW ================= */

    const canvasRef = useRef<HTMLCanvasElement>(null)

    /* ================================================= */
    /* LIVE IMAGE EFFECT PREVIEW ENGINE */
    /* ================================================= */

    useEffect(() => {

      if (!file || !canvasRef.current) return

      const img = new Image()
      img.src = URL.createObjectURL(file)

      img.onload = () => {

        const canvas = canvasRef.current!
        const ctx = canvas.getContext("2d")!

        canvas.width = img.width
        canvas.height = img.height

        ctx.clearRect(0,0,canvas.width,canvas.height)

        ctx.save()

        /* ROTATION */
        if (rotation > 0) {
          ctx.translate(canvas.width/2, canvas.height/2)
          ctx.rotate((rotation * Math.PI)/180)
          ctx.translate(-canvas.width/2, -canvas.height/2)
        }

        /* BLUR */
        ctx.filter = `blur(${blur}px)`
        ctx.drawImage(img,0,0)
        ctx.restore()

        /* NOISE */
        if (noise > 0) {
          const imgData = ctx.getImageData(0,0,canvas.width,canvas.height)
          const data = imgData.data

          for (let i=0;i<data.length;i+=4){
            const n = (Math.random()-0.5)*255*noise
            data[i]+=n
            data[i+1]+=n
            data[i+2]+=n
          }

          ctx.putImageData(imgData,0,0)
        }

        /* ERASE */
        if (erase > 0){
          ctx.fillStyle="black"
          ctx.fillRect(
            canvas.width*(1-erase),
            canvas.height*(1-erase),
            canvas.width*erase,
            canvas.height*erase
          )
        }

      }

    }, [file, blur, rotation, noise, erase])

    /* ================================================= */
    /* RUN INFERENCE */
    /* ================================================= */

    async function runInference() {

      setLoading(true)
      setError(null)

      const form = new FormData()
      let endpoint=""

      if (mode==="SINGLE") {

        if(!file){
          setError("Upload image")
          setLoading(false)
          return
        }

        form.append("image",file)
        form.append("expected_digit",selectedDigit.toString())

        endpoint="/api/run"

      } else {

        endpoint="/api/run-dataset"

        if(datasetSource==="CUSTOM"){

          if(!file){
            setError("Upload ZIP file")
            setLoading(false)
            return
          }

          form.append("zip_file",file)

        } else {
          form.append("dataset_name",selectedDataset)
        }

      }

      /* Stress params for both */
      form.append("blur",String(blur))
      form.append("rotation",String(rotation))
      form.append("noise",String(noise))
      form.append("erase",String(erase))

      try{
        const res=await fetch(endpoint,{method:"POST",body:form})
        const json=await res.json()

        const id = json.id || json.result_id
        if(!id) throw new Error()

        router.push(`/results/${id}`)

      }catch{
        setError("Inference failed")
      }

      setLoading(false)
    }

    /* ================================================= */
    /* UI */
    /* ================================================= */

    return (
      <div className="mx-auto max-w-5xl p-8 space-y-8">

        <h1 className="text-3xl font-bold">
          Run Inference
        </h1>

        <EvaluationModeSelector mode={mode} setMode={setMode} />

        {/* ================================================= */}
        {/* SINGLE MODE */}
        {/* ================================================= */}

        {mode==="SINGLE" && (
          <div className="space-y-6">

            <select
              value={selectedDigit}
              onChange={(e)=>setSelectedDigit(Number(e.target.value))}
              className="border rounded-lg px-3 py-2 w-full"
            >
              {[0,1,2,3,4,5,6,7,8,9].map(d=>(
                <option key={d}>{d}</option>
              ))}
            </select>

            {/* Upload */}
            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer hover:bg-gray-50">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e)=>setFile(e.target.files?.[0] || null)}
              />
              Click / Drag Image
            </label>

            {/* Live Preview */}
            {file && (
              <div>
                <p className="text-sm font-medium mb-2">
                  Live Stress Preview
                </p>

                <canvas
                  ref={canvasRef}
                  className="border rounded-lg max-h-64"
                />
              </div>
            )}

          </div>
        )}

        {/* ================================================= */}
        {/* DATASET MODE */}
        {/* ================================================= */}

        {mode==="DATASET" && (
          <div className="space-y-6">

            <div className="flex gap-6">

              <label className="flex gap-2 items-center">
                <input
                  type="radio"
                  checked={datasetSource==="PREBUILT"}
                  onChange={()=>setDatasetSource("PREBUILT")}
                />
                Prebuilt Dataset
              </label>

              <label className="flex gap-2 items-center">
                <input
                  type="radio"
                  checked={datasetSource==="CUSTOM"}
                  onChange={()=>setDatasetSource("CUSTOM")}
                />
                Custom ZIP
              </label>

            </div>

            {datasetSource==="PREBUILT" && (
              <select
                value={selectedDataset}
                onChange={(e)=>setSelectedDataset(e.target.value)}
                className="border rounded-lg px-3 py-2 w-full"
              >
                {PREBUILT_DATASETS.map(d=>(
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            )}

            {datasetSource==="CUSTOM" && (
              <input
                type="file"
                accept=".zip"
                onChange={(e)=>setFile(e.target.files?.[0] || null)}
                className="border rounded-lg px-3 py-2 w-full"
              />
            )}

          </div>
        )}

        {/* ================================================= */}
        {/* STRESS CONTROLS */}
        {/* ================================================= */}

        <div className="border rounded-xl p-5 bg-gray-50 space-y-4">

          <h2 className="font-semibold">
            Stress / Perturbation Controls
          </h2>

          <Slider label="Blur" value={blur} setValue={setBlur} min={0} max={5} step={0.1}/>
          <Slider label="Rotation" value={rotation} setValue={setRotation} min={0} max={30}/>
          <Slider label="Noise" value={noise} setValue={setNoise} min={0} max={0.5} step={0.01}/>
          <Slider label="Erase" value={erase} setValue={setErase} min={0} max={0.4} step={0.05}/>

        </div>

        {error && <p className="text-red-600">{error}</p>}

        <button
          onClick={runInference}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg"
        >
          {loading ? "Running..." : "Run Evaluation"}
        </button>

      </div>
    )
  }

  /* ================= SLIDER ================= */

  function Slider({label,value,setValue,min,max,step=1}:any){
    return(
      <div>
        <p className="text-sm font-medium">{label}</p>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e)=>setValue(Number(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-gray-500">{value}</p>
      </div>
    )
  }