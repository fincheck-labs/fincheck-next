#  API Specification Sheet

**Project:** MNIST & CIFAR Model Evaluation, OCR & Cheque Verification Service
**Base URL:** `http://<host>:<port>`
**Content Type:** `multipart/form-data` (for file uploads), `application/json` (responses)

---


## 🔹 2. Run Single Image Inference (MNIST)

### **POST** `/run`

Runs inference on **one handwritten digit image** with optional stress testing.

#### Request

**Content-Type:** `multipart/form-data`

| Field            | Type    | Required | Description                  |
| ---------------- | ------- | -------- | ---------------------------- |
| `image`          | File    | ✅        | Grayscale or RGB digit image |
| `expected_digit` | Integer | ✅        | Ground truth digit (0–9)     |
| `blur`           | Float   | ❌        | Gaussian blur intensity      |
| `rotation`       | Float   | ❌        | Rotation angle (degrees)     |
| `noise`          | Float   | ❌        | Gaussian noise std           |
| `erase`          | Float   | ❌        | Random erasing percentage    |

#### Response

```json
{
  "id": "65b9e5f4c1e9a0d7a9c312ab"
}
```

---

## 🔹 3. Run Dataset Evaluation (MNIST + CIFAR)

### **POST** `/run-dataset`

Runs batch evaluation on predefined datasets.

#### Request

**Content-Type:** `multipart/form-data`

| Field          | Type   | Required | Description        |
| -------------- | ------ | -------- | ------------------ |
| `dataset_name` | String | ✅        | Dataset identifier |
| `blur`         | Float  | ❌        | Gaussian blur      |
| `rotation`     | Float  | ❌        | Rotation angle     |
| `noise`        | Float  | ❌        | Noise std          |
| `erase`        | Float  | ❌        | Random erase pct   |

#### Supported `dataset_name`

* `MNIST_100`
* `MNIST_500`
* `MNIST_FULL`
* `MNIST_NOISY_100`
* `MNIST_NOISY_500`
* `MNIST_NOISY_BLUR_100`
* `MNIST_NOISY_BLUR_500`

#### Response

```json
{
  "id": "65b9e6a8c1e9a0d7a9c312ac"
}
```

---

## 🔹 4. Fetch Stored Results

### **GET** `/results/{id}`

Fetches evaluation results from MongoDB.

#### Path Parameter

| Name | Type   | Description      |
| ---- | ------ | ---------------- |
| `id` | String | MongoDB ObjectId |

#### Response (Simplified)

```json
{
  "_id": "65b9e6a8c1e9a0d7a9c312ac",
  "data": {
    "MNIST": {
      "kd_mnist.pth": {
        "latency_ms": 1.42,
        "confidence_percent": 97.8,
        "entropy": 0.12,
        "stability": 0.31,
        "evaluation": {
          "FAR": 0.012,
          "FRR": 0.018,
          "risk_score": 0.015
        }
      }
    },
    "CIFAR": { }
  },
  "meta": {
    "dataset_type": "MNIST_100",
    "stress_applied": false
  }
}
```

---

## 🔹 5. Export PDF Report

### **GET** `/export/pdf/{id}`

Exports evaluation results as a **PDF report**.

#### Response

* `Content-Type: application/pdf`
* Downloadable PDF file

---

## 🔹 6. OCR Verification (Typed vs Image)

### **POST** `/verify`

Verifies typed digits against OCR-extracted digits.

#### Request

**Content-Type:** `multipart/form-data`

| Field      | Type   | Required |
| ---------- | ------ | -------- |
| `image`    | File   | ✅        |
| `raw_text` | String | ✅        |

#### Response

```json
{
  "verdict": "VALID_TYPED_TEXT",
  "final_output": "12345",
  "errors": []
}
```

---

## 🔹 7. Digit-Only Verification (Cheque-Safe)

### **POST** `/verify-digit-only`

Segments digits, normalizes MNIST style, and verifies confidence.

#### Request

| Field                  | Type  | Required         |
| ---------------------- | ----- | ---------------- |
| `image`                | File  | ✅                |
| `confidence_threshold` | Float | ❌ (default 0.90) |

#### Response

```json
{
  "verdict": "AMBIGUOUS",
  "digits": "1052",
  "analysis": [
    {
      "position": 1,
      "predicted": "1",
      "confidence": 98.2,
      "status": "VALID"
    }
  ],
  "preview": {
    "original": "base64...",
    "cropped": "base64...",
    "normalized": "base64..."
  }
}
```

---

## 🔹 8. Extract Cheque Amount (Digits + Words)

### **POST** `/extract-cheque-amount`

Extracts and verifies cheque amount using **OCR + YOLO fallback**.

#### Request

| Field  | Type | Required |
| ------ | ---- | -------- |
| `file` | File | ✅        |

#### Response

```json
{
  "amount_digits": "10,000",
  "amount_words": "TEN THOUSAND RUPEES ONLY",
  "digits_value": 10000,
  "words_value": 10000,
  "verification_status": "MATCH",
  "used_yolo_fallback": false
}
```

---

## 🔹 9. Risk & Evaluation Metrics

### Computed Metrics

* **Confidence (%)**
* **Latency (ms/image)**
* **Entropy**
* **Stability**
* **FAR (False Accept Rate)**
* **FRR (False Reject Rate)**
* **Risk Score = α·FAR + β·FRR**

---

## 🔹 10. Error Codes

| Status | Meaning                   |
| ------ | ------------------------- |
| 400    | Invalid request / dataset |
| 404    | Result not found          |
| 500    | Internal server error     |

---

## 🔹 11. Storage

* **Database:** MongoDB Atlas
* **Collection:** `model_results`
* **Stored:** Metrics, confusion matrices, metadata, timestamps

---

