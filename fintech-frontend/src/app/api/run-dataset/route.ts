import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // ---------- Read incoming form ----------
    const incomingForm = await req.formData();

    const datasetName = incomingForm.get("dataset_name");
    const zipFile = incomingForm.get("zip_file");

    if (!datasetName && !(zipFile instanceof File)) {
      return NextResponse.json(
        { error: "No dataset_name or zip_file provided" },
        { status: 400 }
      );
    }

    // ---------- Backend URL ----------
    const API_URL = process.env.INFERENCE_API_URL;
    if (!API_URL) {
      return NextResponse.json(
        { error: "Inference API not configured" },
        { status: 500 }
      );
    }

    // ---------- Forward ALL fields exactly ----------
    const forwardForm = new FormData();
    incomingForm.forEach((value, key) => {
      forwardForm.append(key, value as any);
    });

    // ---------- Call FastAPI ----------
    const r = await fetch(`${API_URL}/run-dataset`, {
      method: "POST",
      body: forwardForm,
    });

    const text = await r.text();

    if (!r.ok) {
      console.error("FastAPI /run-dataset failed:", text);
      return NextResponse.json(
        { error: text },
        { status: 500 }
      );
    }

    const data = JSON.parse(text);

    // ✅ EXPECT ONLY `id`
    if (!data.id) {
      console.error("Unexpected FastAPI response:", data);
      return NextResponse.json(
        { error: "Backend did not return result id" },
        { status: 500 }
      );
    }

    // ---------- RETURN ID TO FRONTEND ----------
    return NextResponse.json({
      id: data.id,
    });

  } catch (err) {
    console.error("run-dataset API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
