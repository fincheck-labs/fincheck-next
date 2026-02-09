import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()

    const API_URL = process.env.INFERENCE_API_URL

    if (!API_URL) {
      return NextResponse.json(
        { error: "Inference API not configured" },
        { status: 500 }
      )
    }

    const res = await fetch(`${API_URL}/verify`, {
      method: "POST",
      body: formData,
    })

    if (!res.ok) {
      const text = await res.text()
      console.error("Backend /verify failed:", text)
      return NextResponse.json(
        { error: "Verify failed on backend" },
        { status: 500 }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error("Verify API error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}