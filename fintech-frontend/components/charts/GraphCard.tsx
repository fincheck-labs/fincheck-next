"use client"

export default function GraphCard({
  title,
  description,
  userHint,
  bestLabel,
  bestReason,
  children,
}: {
  title: string
  description?: string
  userHint?: string
  bestLabel?: string
  bestReason?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-700">
              {title}
            </h3>

            {userHint && (
              <span
                title={userHint}
                className="cursor-help text-gray-400"
              >
                ℹ️
              </span>
            )}
          </div>

          {description && (
            <p className="mt-1 text-xs text-gray-500 max-w-xl">
              {description}
            </p>
          )}
        </div>

        {bestLabel && (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            🏆 Best: {bestLabel}
            {bestReason && (
              <span className="block text-[10px] text-green-600">
                ({bestReason})
              </span>
            )}
          </span>
        )}
      </div>

      {children}
    </div>
  )
}