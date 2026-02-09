"use client"

import { exportPdfSingle } from "@/lib/exportPdf"
import { useState } from "react"

export default function ExportSinglePdfButton() {
  const [file, setFile] = useState<File | null>(null)
  const [digit, setDigit] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    if (!file) return alert("Upload image first")

    try {
      setLoading(true)
      await exportPdfSingle(file, Number(digit))
    } catch {
      alert("Export failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />

      <input
        type="number"
        placeholder="Expected digit"
        className="border p-2 rounded"
        value={digit}
        onChange={(e) => setDigit(e.target.value)}
      />

      <button
        onClick={handleExport}
        className="px-4 py-2 rounded-lg bg-primary text-white"
        disabled={loading}
      >
        {loading ? "Generating PDF..." : "Export PDF"}
      </button>
    </div>
  )
}
