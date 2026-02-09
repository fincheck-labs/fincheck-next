import Link from "next/link"
import { connectMongo } from "@/lib/mongodb"

export const dynamic = "force-dynamic"

type ResultDoc = {
  _id: any
  createdAt: Date
  data: Record<string, any>
  meta?: {
    evaluation_type?: "SINGLE" | "DATASET"
    source?: "PREBUILT" | "CUSTOM" | "IMAGE_UPLOAD"
    dataset_type?: string
    num_images?: number
  }
}

/* ---------- META NORMALIZATION ---------- */
function normalizeMeta(meta?: ResultDoc["meta"]) {
  return {
    evaluation_type: meta?.evaluation_type ?? "SINGLE",
    source: meta?.source ?? "IMAGE_UPLOAD",
    dataset_type: meta?.dataset_type,
    num_images: meta?.num_images,
  }
}

export default async function ResultsPage() {
  const db = await connectMongo()

  const docs = (await db
    .collection("model_results")
    .find()
    .sort({ createdAt: -1 })
    .toArray()) as ResultDoc[]

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <h1 className="text-3xl font-bold text-base-content">
        Inference History
      </h1>

      {docs.map((doc) => {
        const meta = normalizeMeta(doc.meta)

        return (
          <Link
            key={doc._id.toString()}
            href={`/results/${doc._id}`}
            className="block rounded-xl border border-base-300 bg-base-100 p-5 transition hover:shadow-md hover:border-primary"
          >
            <p className="text-sm text-base-content/60">
              {new Date(doc.createdAt).toLocaleString()}
            </p>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="badge badge-primary badge-outline">
                {meta.evaluation_type === "SINGLE"
                  ? "Single Image"
                  : "Dataset"}
              </span>

              <span className="badge badge-secondary badge-outline">
                {meta.source}
              </span>

              {meta.dataset_type && (
                <span className="badge badge-success badge-outline">
                  {meta.dataset_type}
                </span>
              )}

              {meta.num_images && (
                <span className="badge badge-neutral badge-outline">
                  {meta.num_images} images
                </span>
              )}
            </div>
          </Link>
        )
      })}

      {docs.length === 0 && (
        <p className="text-sm text-base-content/60">
          No inference results found yet.
        </p>
      )}
    </div>
  )
}