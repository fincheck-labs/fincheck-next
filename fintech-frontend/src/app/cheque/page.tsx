"use client";
import { useState } from "react";

type ChequeResult = {
  amount_digits?: string | null;
  amount_words?: string | null;
  digits_value?: number | null;
  words_value?: number | null;
  verification_status?: "MATCH" | "MISMATCH" | "UNVERIFIED";
  used_yolo_fallback?: boolean;
  raw_ocr_text?: string;
  digits_roi_ocr?: string;
};

export default function ChequeAmountExtractor() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ChequeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(
        "http://127.0.0.1:8000/extract-cheque-amount",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) throw new Error("API failed");

      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  const statusStyles = {
    MATCH: {
      bg: "#d4edda",
      label: "✔ Amounts Match",
      hint: "Digits and words agree — cheque is valid.",
    },
    MISMATCH: {
      bg: "#f8d7da",
      label: "✖ Amount Mismatch",
      hint: "Digits and words do not match — cheque should be rejected.",
    },
    UNVERIFIED: {
      bg: "#fff3cd",
      label: "⚠ Verification Required",
      hint:
        "OCR confidence insufficient (handwriting / noise). Manual or ML review required.",
    },
  };

  const status =
    statusStyles[result?.verification_status ?? "UNVERIFIED"];

  return (
    <div style={{ maxWidth: 760, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h2>Cheque Amount Extractor</h2>
      <p style={{ fontSize: 14, color: "#555" }}>
        Rule-based OCR with ML fallback (YOLOv8-nano)
      </p>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <br /><br />

      <button onClick={submit} disabled={loading || !file}>
        {loading ? "Processing…" : "Extract Amount"}
      </button>

      {file && !loading && (
        <button
          onClick={reset}
          style={{ marginLeft: 10 }}
        >
          Reset
        </button>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 28 }}>
          <p>
            <b>Amount (Digits):</b>{" "}
            {result.amount_digits ?? "Not detected"}
          </p>

          <p>
            <b>Amount (Words):</b>{" "}
            {result.amount_words ?? "Not detected"}
          </p>

          <p>
            <b>Digits → Number:</b>{" "}
            {result.digits_value ?? "—"}
          </p>

          <p>
            <b>Words → Number:</b>{" "}
            {result.words_value ?? "—"}
          </p>

          <div
            style={{
              marginTop: 18,
              padding: 14,
              background: status.bg,
              border: "1px solid #ccc",
            }}
          >
            <b>Status:</b> {status.label}
            <div style={{ fontSize: 13, marginTop: 4 }}>
              {status.hint}
            </div>

            {result.used_yolo_fallback && (
              <div style={{ marginTop: 8, fontSize: 13 }}>
                🔍 ML fallback activated to re-locate handwritten amount text
              </div>
            )}
          </div>

          <details style={{ marginTop: 18 }}>
            <summary>Raw OCR Output (Full Cheque)</summary>
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {result.raw_ocr_text}
            </pre>
          </details>

          <details style={{ marginTop: 12 }}>
            <summary>Digits ROI OCR</summary>
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {result.digits_roi_ocr}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
