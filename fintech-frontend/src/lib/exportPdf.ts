export async function exportPdfDataset(datasetName: string) {
  const form = new FormData()
  form.append("dataset_name", datasetName)

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_INFERENCE_API_URL}/export-pdf`,
    {
      method: "POST",
      body: form,
    }
  )

  if (!res.ok) throw new Error("PDF export failed")

  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = "mnist_report.pdf"
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export async function exportPdfSingle(
  file: File,
  expectedDigit?: number
) {
  const form = new FormData()
  form.append("image", file)

  if (expectedDigit !== undefined) {
    form.append("expected_digit", String(expectedDigit))
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_INFERENCE_API_URL}/export-pdf`,
    {
      method: "POST",
      body: form,
    }
  )

  if (!res.ok) throw new Error("PDF export failed")

  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = "mnist_report.pdf"
  document.body.appendChild(a)
  a.click()
  a.remove()
}
