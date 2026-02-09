import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {

    const { id } = await context.params

    const API_URL = process.env.INFERENCE_API_URL

    if (!API_URL) {
      return NextResponse.json(
        { error: "Inference API not configured" },
        { status: 500 }
      )
    }

    const r = await fetch(
      `${API_URL}/export/pdf/${id}`
    )

    if (!r.ok) {
      const text = await r.text()
      return NextResponse.json(
        { error: text },
        { status: 500 }
      )
    }

    const blob = await r.arrayBuffer()

    return new NextResponse(blob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=result_${id}.pdf`,
      },
    })

  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: "Export failed" },
      { status: 500 }
    )
  }
}
