import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Buffer } from "buffer";

export const API_BASE_URL =
  "https://00b1-103-5-112-80.ngrok-free.app";

const NGROK_HEADERS = {
  "ngrok-skip-browser-warning": "true",
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function handle(res: Response) {
  if (!res.ok) {
    throw new ApiError("Request failed", res.status);
  }
  return res.json();
}

export async function fetchResult(id: string) {
  const res = await fetch(`${API_BASE_URL}/results/${id}`, {
    headers: NGROK_HEADERS,
  });
  return handle(res);
}

export async function getAllResults() {
  const res = await fetch(`${API_BASE_URL}/results`, {
    headers: NGROK_HEADERS,
  });
  return handle(res);
}

export async function downloadResultPdf(id: string) {
  const res = await fetch(`${API_BASE_URL}/export/pdf/${id}`, {
    headers: NGROK_HEADERS,
  });

  if (!res.ok) {
    throw new ApiError("PDF download failed", res.status);
  }

  // ✅ Binary fetch
  const arrayBuffer = await res.arrayBuffer();

  // ✅ Convert to base64
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  // ✅ Correct document directory
  const fileUri =
    `${FileSystem.documentDirectory}evaluation_${id}.pdf`;

  // ✅ WRITE USING STRING LITERAL (TS-safe)
  await FileSystem.writeAsStringAsync(
    fileUri,
    base64,
    { encoding: "base64" }
  );

  // ✅ Share
  await Sharing.shareAsync(fileUri);

  return fileUri;
}

export async function runSingleInference(params: {
  image: { uri: string; name?: string; type?: string };
  expectedDigit: number;
  blur?: number;
  rotation?: number;
  noise?: number;
  erase?: number;
}) {
  const f = new FormData();

  f.append("image", {
    uri: params.image.uri,
    name: params.image.name ?? "image.png",
    type: params.image.type ?? "image/png",
  } as any);

  f.append("expected_digit", String(params.expectedDigit));
  f.append("blur", String(params.blur ?? 0));
  f.append("rotation", String(params.rotation ?? 0));
  f.append("noise", String(params.noise ?? 0));
  f.append("erase", String(params.erase ?? 0));

  const res = await fetch(`${API_BASE_URL}/run`, {
    method: "POST",
    headers: NGROK_HEADERS,
    body: f,
  });

  return handle(res);
}

export async function runDatasetEvaluation(params: {
  datasetName: string;
  blur?: number;
  rotation?: number;
  noise?: number;
  erase?: number;
}) {
  const f = new FormData();

  f.append("dataset_name", params.datasetName);
  f.append("blur", String(params.blur ?? 0));
  f.append("rotation", String(params.rotation ?? 0));
  f.append("noise", String(params.noise ?? 0));
  f.append("erase", String(params.erase ?? 0));

  const res = await fetch(`${API_BASE_URL}/run-dataset`, {
    method: "POST",
    headers: NGROK_HEADERS,
    body: f,
  });

  return handle(res);
}

export async function verifyTypedText(params: {
  image: { uri: string; name?: string; type?: string };
  rawText: string;
}) {
  const f = new FormData();

  f.append("image", {
    uri: params.image.uri,
    name: params.image.name ?? "input.png",
    type: params.image.type ?? "image/png",
  } as any);

  f.append("raw_text", params.rawText);

  const res = await fetch(`${API_BASE_URL}/verify`, {
    method: "POST",
    headers: NGROK_HEADERS,
    body: f,
  });

  return handle(res);
}

export async function verifyDigitOnly(params: {
  image: { uri: string; name?: string; type?: string };
  confidenceThreshold?: number;
}) {
  const f = new FormData();

  f.append("image", {
    uri: params.image.uri,
    name: params.image.name ?? "digits.png",
    type: params.image.type ?? "image/png",
  } as any);

  f.append(
    "confidence_threshold",
    String(params.confidenceThreshold ?? 0.9)
  );

  const res = await fetch(`${API_BASE_URL}/verify-digit-only`, {
    method: "POST",
    headers: NGROK_HEADERS,
    body: f,
  });

  return handle(res);
}

export async function extractChequeAmount(image: {
  uri: string;
  name?: string;
  type?: string;
}) {
  const f = new FormData();

  f.append("file", {
    uri: image.uri,
    name: image.name ?? "cheque.png",
    type: image.type ?? "image/png",
  } as any);

  const res = await fetch(`${API_BASE_URL}/extract-cheque-amount`, {
    method: "POST",
    headers: NGROK_HEADERS,
    body: f,
  });

  return handle(res);
}
