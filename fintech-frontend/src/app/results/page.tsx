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
    .limit(50) // Prevent loading too many docs for performance
    .toArray()) as ResultDoc[]

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-base-content to-primary bg-clip-text text-transparent">
            Inference History
          </h1>
          <p className="text-base-content/60 mt-1">
            {docs.length} recent evaluations
          </p>
        </div>
        {docs.length > 0 && (
          <div className="text-sm text-base-content/50">
            Showing most recent 50 results
          </div>
        )}
      </div>

      {/* Results Grid */}
      {docs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {docs.map((doc) => {
            const meta = normalizeMeta(doc.meta)
            const shortId = doc._id.toString().slice(-8)

            return (
              <Link
                key={doc._id.toString()}
                href={`/results/${doc._id}`}
                className="group block card bg-base-100 shadow-lg hover:shadow-2xl border-0 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] overflow-hidden"
              >
                <div className="card-body p-6 pb-4">
                  {/* Timestamp & ID */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm font-mono text-base-content/70 group-hover:text-primary transition-colors">
                      <span className="text-xs opacity-75">{shortId}</span>
                    </div>
                    <div className="text-xs font-mono bg-base-200 px-2 py-1 rounded-full text-base-content/60 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                      {new Date(doc.createdAt).toLocaleString("en-IN", {
                         timeZone: "Asia/Kolkata",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                      })}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className={`badge badge-lg ${meta.evaluation_type === "SINGLE" ? "badge-primary" : "badge-secondary"} shadow-md`}>
                      {meta.evaluation_type === "SINGLE" ? "🖼️ Single" : "📊 Dataset"}
                    </span>
                    <span className={`badge badge-lg badge-outline shadow-sm px-3 py-2 transition-all group-hover:scale-105 ${
                      meta.source === "PREBUILT" ? "badge-accent" :
                      meta.source === "CUSTOM" ? "badge-info" : "badge-warning"
                    }`}>
                      {meta.source}
                    </span>
                    {meta.dataset_type && (
                      <span className="badge badge-success badge-outline shadow-sm px-3 py-2 transition-all group-hover:scale-105">
                        {meta.dataset_type}
                      </span>
                    )}
                    {meta.num_images && (
                      <span className="badge badge-neutral badge-outline shadow-sm px-3 py-2 transition-all group-hover:scale-105">
                        {meta.num_images.toLocaleString()} imgs
                      </span>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="card-actions justify-end pt-4 border-t border-base-200">
                    <button className="btn btn-primary btn-sm shadow-lg group-hover:shadow-xl transition-all flex items-center gap-2">
                      View Details
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        /* Enhanced Empty State */
        <div className="text-center py-20 px-8 space-y-6 bg-base-200/50 rounded-2xl border-2 border-dashed border-base-300">
          <div className="w-24 h-24 mx-auto bg-linear-to-r from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-primary/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-base-content">No results yet</h2>
            <p className="text-base-content/60 max-w-md mx-auto">
              Run your first model inference to see results appear here. Your history will be saved automatically.
            </p>
          </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/upload" className="btn btn-primary shadow-lg">
              Start Evaluation
            </Link>
            <Link href="/docs" className="btn btn-outline btn-ghost">
              View Documentation
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
