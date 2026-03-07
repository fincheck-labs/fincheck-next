"use client";
import { AlertCircle, CheckCircle2, FileText, Image, Loader2, Upload, Zap } from "lucide-react";
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

const statusConfig = {
  MATCH: {
    icon: CheckCircle2,
    bg: "bg-green-50 border-green-200 text-green-800",
    label: "Amounts Match",
    hint: "Digits and words agree perfectly — cheque is valid.",
  },
  MISMATCH: {
    icon: AlertCircle,
    bg: "bg-red-50 border-red-200 text-red-800",
    label: "Amount Mismatch",
    hint: "Digits and words do not match — reject this cheque.",
  },
  UNVERIFIED: {
    icon: AlertCircle,
    bg: "bg-yellow-50 border-yellow-200 text-yellow-800",
    label: "Verification Required",
    hint: "Low OCR confidence (handwriting/noise). Needs manual/ML review.",
  },
} as const;

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

      if (!res.ok) throw new Error("API request failed");

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

  const status = result?.verification_status
    ? statusConfig[result.verification_status as keyof typeof statusConfig]
    : statusConfig.UNVERIFIED;

  const Icon = status.icon;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm shadow-lg border border-white/50 mb-6">
            <Zap className="w-5 h-5 text-blue-600 mr-2" />
            <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Cheque Amount Extractor
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed">
            AI-powered OCR with rule-based verification & OpenOCR fallback for handwritten cheques
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 mb-8">
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
            <Upload className="w-10 h-10 text-white" />
          </div>

          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-600 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              disabled={loading}
            />

            <div className="flex gap-3 pt-2">
              <button
                onClick={submit}
                disabled={loading || !file}
                className="flex-1 bg-linear-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Extract Amount"
                )}
              </button>

              {file && !loading && (
                <button
                  onClick={reset}
                  className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8 shadow-md">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 mt-0.5 shrink-0" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Status Card */}
            <div className={`p-8 rounded-2xl shadow-xl border-2 ${status.bg}`}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-white/50 backdrop-blur-sm flex items-center justify-center shadow-lg shrink-0">
                  <Icon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{status.label}</h3>
                  <p className="text-lg mt-1">{status.hint}</p>
                </div>
              </div>

              {result.used_yolo_fallback && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white/60 rounded-xl backdrop-blur-sm border">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-900">YOLOv8 ML fallback activated for handwritten text detection</span>
                </div>
              )}
            </div>

            {/* Amounts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900">Amount Details</h4>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">Digits</label>
                    <div className="text-2xl font-bold text-gray-900 p-3 bg-linear-to-r from-gray-50 to-gray-100 rounded-xl">
                      {result.amount_digits ?? "Not detected"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">Words</label>
                    <div className="text-2xl font-bold text-gray-900 p-3 bg-linear-to-r from-gray-50 to-gray-100 rounded-xl">
                      {result.amount_words ?? "Not detected"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Image className="w-5 h-5 text-green-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900">Parsed Values</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Digits → Number</label>
                    <div className="text-xl font-bold text-gray-900">
                      {result.digits_value ?? "—"}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Words → Number</label>
                    <div className="text-xl font-bold text-gray-900">
                      {result.words_value ?? "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Debug Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <details className="group bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300">
                <summary className="flex items-center gap-3 cursor-pointer font-semibold text-gray-900 pb-3 group-hover:text-blue-600 transition-colors">
                  <FileText className="w-5 h-5 shrink-0" />
                  Raw OCR Output (Full Cheque)
                </summary>
                <pre className="text-sm bg-gray-50 rounded-xl p-4 font-mono overflow-auto max-h-48">
                  {result.raw_ocr_text || "No OCR data"}
                </pre>
              </details>

              <details className="group bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300">
                <summary className="flex items-center gap-3 cursor-pointer font-semibold text-gray-900 pb-3 group-hover:text-blue-600 transition-colors">
                  <Image className="w-5 h-5 shrink-0" />
                  Digits ROI OCR
                </summary>
                <pre className="text-sm bg-gray-50 rounded-xl p-4 font-mono overflow-auto max-h-48">
                  {result.digits_roi_ocr || "No ROI data"}
                </pre>
              </details>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
