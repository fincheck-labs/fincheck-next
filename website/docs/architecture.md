---
title: Architecture Overview
sidebar_position: 2
---

# Architecture Overview

## 1. Architectural Objective

Fincheck is architected as a **risk-aware validation system** rather than a traditional OCR or digit-recognition pipeline.
The primary objective of the architecture is to **prevent unsafe predictions** in financial workflows by explicitly modeling **uncertainty, confidence, and operational risk**.

Unlike accuracy-driven systems, Fincheck is designed to:

* Detect ambiguous or out-of-distribution digits
* Refuse predictions when confidence is insufficient
* Provide traceable, auditable evaluation artifacts
* Support controlled experimentation and benchmarking

The architecture prioritizes **safety, reproducibility, and explainability** over raw throughput.

---

## 2. High-Level System Flow

```
Input Image / Dataset
        ↓
Preprocessing & Normalization
        ↓
Digit Segmentation
        ↓
MNIST-Style Digit Canonicalization
        ↓
Multi-Model Inference
        ↓
Uncertainty & Risk Computation
        ↓
Decision Logic (VALID / AMBIGUOUS / INVALID)
        ↓
Persistence, Reporting & Visualization
```

Each stage acts as an **independent risk control point**, ensuring that errors or ambiguities do not propagate silently.

---

## 3. Layered Architecture

Fincheck follows a **layered, modular architecture** consisting of five primary layers:

1. Input & Preprocessing Layer
2. Segmentation & Canonicalization Layer
3. Model Inference & Risk Evaluation Layer
4. Persistence & Reporting Layer
5. Visualization & Interaction Layer

Each layer is loosely coupled and independently testable.

---

## 4. Input & Preprocessing Layer

### Purpose

This layer standardizes raw inputs and removes low-level noise before any learning-based inference.

### Responsibilities

* Grayscale conversion
* Stroke enhancement using morphological operations
* Adaptive and Otsu thresholding
* Noise suppression
* Region-of-interest extraction for cheque fields

### Design Rationale

Preprocessing is treated as a **risk mitigation stage**.
Poor-quality inputs are intentionally degraded into low-confidence representations rather than artificially enhanced.

### Technologies

* OpenCV
* NumPy
* PIL

---

## 5. Digit Segmentation & Canonicalization Layer

### Segmentation Strategy

Digits are extracted using **connected component analysis**, followed by geometric filtering:

* Minimum area threshold
* Width and height constraints
* Left-to-right ordering

Components that do not satisfy geometric constraints are rejected early.

### MNIST Canonicalization

Each accepted digit undergoes strict normalization:

* Tight bounding-box crop
* Aspect-ratio–preserving resize
* Placement on a 28×28 canvas
* Center-of-mass alignment

### Architectural Role

This layer enforces a **digit shape prior**.
Digits that cannot be normalized into a valid MNIST-like representation are considered **structurally unsafe** and rejected.

---

## 6. Model Inference & Risk Evaluation Layer

### Model Strategy

Multiple MNIST-based CNN variants are loaded into memory at startup and evaluated under identical conditions:

* Baseline CNN
* Knowledge Distillation
* Pruned models
* Quantized models
* Low-Rank Factorized models
* Weight Sharing models

This enables **comparative risk evaluation**, not just single-model prediction.

### Inference Outputs

For each model, the system computes:

* Softmax confidence
* Entropy (uncertainty)
* Logit stability
* Per-image latency

### Risk Metrics

Ground-truth–aware evaluations compute:

* False Accept Rate (FAR)
* False Reject Rate (FRR)
* Composite Risk Score

Risk Score is defined as:

```
Risk = α × FAR + β × FRR
```

Lower risk is preferred over higher accuracy.

---

## 7. Decision Logic Layer

Fincheck employs a **three-state decision model**:

* **VALID** — High confidence, low uncertainty
* **AMBIGUOUS** — Borderline confidence, requires review
* **INVALID** — Low confidence or structurally unsafe

This design prevents forced predictions and supports **human-in-the-loop workflows**.

The system explicitly favors **false rejection over false acceptance**, aligning with financial safety requirements.

---

## 8. Persistence & Reporting Layer

### Purpose

This layer provides **auditability, traceability, and reproducibility**.

### Stored Artifacts

* Model-wise metrics
* Confusion matrices
* FAR / FRR / Risk scores
* Stress-test parameters
* Dataset metadata
* Timestamps

### Reporting

* Automated PDF generation
* Metrics tables
* Confusion matrix visualization
* Experiment metadata embedding

### Technologies

* MongoDB
* ReportLab
* BSON ObjectId indexing

This ensures that every evaluation can be reconstructed and verified post hoc.

---

## 9. OCR & Cheque Verification Subsystem

For cheque-specific workflows, Fincheck integrates:

* Classical OCR (Tesseract)
* Rule-based numeric and word parsing
* YOLO-based fallback detection for amount-in-words regions

This hybrid design reduces silent OCR failures and improves robustness in real-world cheque scans.

---

## 10. Visualization & Interaction Layer

The frontend acts as an **experiment control panel**, not a decision authority.

### Capabilities

* Single image validation
* Dataset benchmarking
* Stress parameter tuning
* Confidence threshold control
* Risk-based model sorting
* Preprocessed image preview
* PDF report download

### Design Principle

All decisions originate from the backend.
The frontend is intentionally **non-authoritative** to preserve evaluation integrity.

---

## 11. Reproducibility & Determinism

The architecture enforces reproducibility through:

* Fixed random seeds
* Deterministic CUDA settings
* Explicit model loading
* Dataset versioning
* Database-backed experiment logging

This enables consistent benchmarking and fair comparison across runs.

---

## 12. Architectural Design Principles

Fincheck is guided by the following principles:

* Safety over accuracy
* Rejection over risky acceptance
* Explainability over opacity
* Auditability over convenience
* Research reproducibility over ad-hoc experimentation

---

## 13. Summary

Fincheck’s architecture is intentionally conservative, risk-aware, and auditable.
It transforms handwritten digit recognition from a prediction task into a **decision and risk evaluation problem**, making it suitable for **financial document processing and robustness research**.

The modular design supports both **academic experimentation** and **real-world deployment readiness**.


