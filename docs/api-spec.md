# 📘 Fincheck API Specification

**Confidence-Aware Cheque Digit Validation & Financial Risk Evaluation Service**

---

## Base Configuration

**Base URL:**

```
http://<host>:<port>
```

**Content Types:**

* `multipart/form-data` → file uploads
* `application/json` → responses
* `application/pdf` → PDF export

---

# 1️⃣ Risk Evaluation Endpoints

---

# 1.1 Run Single Image Evaluation

### **POST** `/run`

Runs MNIST inference on a single digit image using all compressed models and applies Evolutionary Risk Optimization (ERO).

---

## Request

**Content-Type:** `multipart/form-data`

| Field            | Type    | Required | Description             |
| ---------------- | ------- | -------- | ----------------------- |
| `image`          | File    | ✅        | Digit image             |
| `expected_digit` | Integer | ✅        | Ground truth (0–9)      |
| `blur`           | Float   | ❌        | Gaussian blur           |
| `rotation`       | Float   | ❌        | Rotation (degrees)      |
| `noise`          | Float   | ❌        | Gaussian noise std      |
| `erase`          | Float   | ❌        | Random erase percentage |

---

## Response

```json
{
  "id": "65b9e5f4c1e9a0d7a9c312ab"
}
```

Result is stored in MongoDB collection:

```
model_results
```

Stored structure:

```json
{
  "data": {
    "MNIST": { ...model metrics... },
    "ea_optimization": { ...ERO result... }
  },
  "meta": {
    "evaluation_type": "SINGLE",
    "expected_digit": 5,
    "stress_applied": false
  }
}
```

---

# 1.2 Run Dataset Benchmarking

### **POST** `/run-dataset`

Runs batch evaluation on MNIST and CIFAR datasets with optional stress perturbations.

Includes:

* Static baseline (α = 0.5)
* Evolutionary Risk Optimization (ERO)
* Cross-dataset comparison

---

## Request

**Content-Type:** `multipart/form-data`

| Field          | Type   | Required |
| -------------- | ------ | -------- |
| `dataset_name` | String | ✅        |
| `blur`         | Float  | ❌        |
| `rotation`     | Float  | ❌        |
| `noise`        | Float  | ❌        |
| `erase`        | Float  | ❌        |

---

## Supported MNIST Dataset Names

* `MNIST_100`
* `MNIST_500`
* `MNIST_FULL`
* `MNIST_NOISY_100`
* `MNIST_NOISY_500`
* `MNIST_NOISY_BLUR_100`
* `MNIST_NOISY_BLUR_500`

CIFAR evaluation is automatically performed (first 1000 test samples).

---

## Response

```json
{
  "id": "65b9e6a8c1e9a0d7a9c312ac"
}
```

Stored structure:

```json
{
  "data": {
    "MNIST": { ... },
    "CIFAR": { ... },
    "ea_optimization": {
      "MNIST": { ... },
      "CIFAR": { ... }
    },
    "static_baseline": {
      "MNIST_best_model": "...",
      "CIFAR_best_model": "..."
    }
  },
  "meta": {
    "evaluation_type": "DATASET",
    "dataset_type": "MNIST_100",
    "stress_applied": false
  }
}
```

---

# 1.3 Fetch Stored Results

### **GET** `/results/{id}`

Fetches full MongoDB document.

---

## Response Example

```json
{
  "_id": "65b9e6a8c1e9a0d7a9c312ac",
  "data": {
    "MNIST": { ... },
    "CIFAR": { ... }
  },
  "meta": { ... }
}
```

---

# 1.4 Export Evaluation Report (PDF)

### **GET** `/export/pdf/{id}`

Generates downloadable PDF report from stored results.

---

## Response

* `Content-Type: application/pdf`
* Downloadable file
* Filename: `result_<id>.pdf`

PDF includes:

* Metrics tables
* Confusion matrices
* Experiment metadata

---

# 2️⃣ Digit & OCR Verification Endpoints

---

# 2.1 OCR Typed vs Image Verification

### **POST** `/verify`

Compares typed text against OCR-extracted text.

---

## Request

| Field      | Type   | Required |
| ---------- | ------ | -------- |
| `image`    | File   | ✅        |
| `raw_text` | String | ✅        |

---

## Response

```json
{
  "verdict": "VALID_TYPED_TEXT",
  "final_output": "12345",
  "errors": [],
  "why": "OCR output perfectly matches typed text."
}
```

Possible verdicts:

* `VALID_TYPED_TEXT`
* `INVALID_OR_AMBIGUOUS`

---

# 2.2 Digit-Only Cheque-Safe Validation

### **POST** `/verify-digit-only`

Performs:

* Stroke enhancement
* Otsu thresholding
* Digit segmentation
* MNIST normalization
* Confidence-based filtering

---

## Request

| Field                  | Type  | Required         |
| ---------------------- | ----- | ---------------- |
| `image`                | File  | ✅                |
| `confidence_threshold` | Float | ❌ (default 0.90) |

---

## Response

```json
{
  "verdict": "AMBIGUOUS",
  "digits": "1052",
  "analysis": [
    {
      "position": 1,
      "predicted": "1",
      "confidence": 98.2,
      "status": "VALID",
      "possible_values": [1, 7, 4]
    }
  ],
  "preview": {
    "original": "base64...",
    "cropped": "base64...",
    "normalized": "base64..."
  }
}
```

Possible statuses:

* `VALID`
* `AMBIGUOUS`
* `INVALID`
* `ERROR`

---

# 2.3 Extract Cheque Amount

### **POST** `/extract-cheque-amount`

Performs:

1. Full-image OCR
2. Digit ROI extraction
3. Word-to-number parsing
4. Numeric comparison
5. YOLO fallback detection (if unverified)

---

## Request

| Field  | Type | Required |
| ------ | ---- | -------- |
| `file` | File | ✅        |

---

## Response

```json
{
  "amount_digits": "10,000",
  "amount_words": "TEN THOUSAND RUPEES ONLY",
  "digits_value": 10000,
  "words_value": 10000,
  "verification_status": "MATCH",
  "used_yolo_fallback": false,
  "raw_ocr_text": "...",
  "digits_roi_ocr": "..."
}
```

Possible `verification_status`:

* `MATCH`
* `MISMATCH`
* `UNVERIFIED`

---

# 3️⃣ Risk Metrics Definition

For each model:

* Confidence (%)
* Latency (ms/image)
* Entropy
* Stability
* FAR
* FRR
* Risk Score

---

## Base Risk Formula

```
Risk = α · FAR + (1 − α) · FRR
```

Default baseline:

```
α = 0.5
```

---

# 4️⃣ Evolutionary Risk Optimization (ERO)

For dataset runs:

Returns:

```json
{
  "alpha": 0.53,
  "beta": 0.47,
  "best_model": "kd_mnist.pth",
  "scores": {
    "baseline_mnist.pth": 0.0213,
    "kd_mnist.pth": 0.0152
  },
  "history": {
    "alpha": [...],
    "fitness": [...],
    "diversity": [...]
  },
  "generations_used": 37
}
```

ERO Characteristics:

* Tournament selection
* Adaptive Gaussian mutation
* Elitism
* Diversity injection
* Stagnation recovery
* Adaptive termination

---

# 5️⃣ Error Codes

| Code | Meaning                    |
| ---- | -------------------------- |
| 400  | Invalid dataset or request |
| 404  | Result not found           |
| 500  | Internal server error      |

---

# 6️⃣ Storage Schema

**MongoDB Database:** `fintech-auth`
**Collection:** `model_results`

Stored:

* MNIST results
* CIFAR results
* Confusion matrices
* ERO outputs
* Static baseline
* Metadata
* Timestamp

---

# 7️⃣ Endpoint Classification

| Category          | Endpoints                |
| ----------------- | ------------------------ |
| Risk Evaluation   | `/run`, `/run-dataset`   |
| Result Retrieval  | `/results/{id}`          |
| Reporting         | `/export/pdf/{id}`       |
| OCR Validation    | `/verify`                |
| Cheque-Safe Digit | `/verify-digit-only`     |
| Amount Extraction | `/extract-cheque-amount` |

---

# 8️⃣ API Safety Model

Fincheck APIs are:

* Confidence-calibrated
* Risk-aware
* Financially interpretable
* Refusal-capable
* Audit-enabled
* Reproducible

---

**Fincheck is not an OCR demo.**
It is a risk-aware digit validation framework for financial systems.
