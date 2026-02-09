import { NextResponse } from "next/server"
import { connectMongo } from "@/lib/mongodb"


export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get("image")

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      )
    }

    // Convert Web File → Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const fd = new FormData()
    fd.append("image", new Blob([buffer]), file.name)

    const API_URL = process.env.INFERENCE_API_URL

    // 🚨 HARD FAIL if env var missing
    if (!API_URL) {
      console.error("INFERENCE_API_URL is not set")
      return NextResponse.json(
        { error: "Inference API not configured" },
        { status: 500 }
      )
    }

    const r = await fetch(`${API_URL}/run`, {
      method: "POST",
      body: fd,
    })

    if (!r.ok) {
      const text = await r.text()
      console.error("Backend /run failed:", text)
      return NextResponse.json(
        { error: "Backend inference failed" },
        { status: 500 }
      )
    }

    const data = await r.json()

    // 🚨 HARD FAIL if backend returned empty data
    if (!data || Object.keys(data).length === 0) {
      console.error("Backend returned EMPTY inference result")
      return NextResponse.json(
        { error: "Empty inference result from backend" },
        { status: 500 }
      )
    }

    const db = await connectMongo()
    const result = await db.collection("model_results").insertOne({
      data,
      createdAt: new Date(),
    })

    return NextResponse.json({ id: result.insertedId })
  } catch (err) {
    console.error("Upload API error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}