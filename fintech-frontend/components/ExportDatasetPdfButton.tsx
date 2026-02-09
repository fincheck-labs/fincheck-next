"use client"

import { exportPdfDataset } from "@/lib/exportPdf"
import { useState } from "react"

export default function ExportDatasetPdfButton({
  datasetName,
}: {
  datasetName: string
}) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    try {
      setLoading(true)
      await exportPdfDataset(datasetName)
    } catch (e) {
      alert("Export failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      className="px-4 py-2 rounded-lg bg-primary text-white"
      disabled={loading}
    >
      {loading ? "Generating PDF..." : "Export PDF"}
    </button>
  )
}
