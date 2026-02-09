import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const incomingForm = await req.formData()

    const image = incomingForm.get("image")
    const expectedDigit = incomingForm.get("expected_digit")

    if (!(image instanceof File)) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    if (expectedDigit === null) {
      return NextResponse.json(
        { error: "Expected digit not provided" },
        { status: 400 }
      )
    }

    const API_URL = process.env.INFERENCE_API_URL
    if (!API_URL) {
      return NextResponse.json(
        { error: "Inference API not configured" },
        { status: 500 }
      )
    }

    /* ---------- Forward ALL fields ---------- */
    const forwardForm = new FormData()
    incomingForm.forEach((v, k) => forwardForm.append(k, v as any))

    const r = await fetch(`${API_URL}/run`, {
      method: "POST",
      body: forwardForm,
    })

    const text = await r.text()

    if (!r.ok) {
      console.error("Backend /run failed:", text)
      return NextResponse.json({ error: text }, { status: 500 })
    }

    const backend = JSON.parse(text)

    // ✅ BACKEND RETURNS { id }
    if (!backend?.id) {
      return NextResponse.json(
        { error: "Backend did not return result id" },
        { status: 500 }
      )
    }

    // ✅ JUST PASS THROUGH THE ID
    return NextResponse.json({
      id: backend.id,
    })

  } catch (err) {
    console.error("run API error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
