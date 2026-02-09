---
title: Evaluation Metrics
sidebar_position: 3
---

## System Philosophy

Fincheck is designed as a **risk-aware verification system**, not a conventional OCR pipeline.
The architecture prioritizes **confidence estimation, uncertainty handling, and auditability**
over raw prediction accuracy.

The system follows a **modular, loosely coupled architecture** to ensure:
- Independent experimentation on models
- Clear separation between inference, evaluation, and presentation
- Easy extensibility to new document types or financial fields

---

## High-Level Architecture

The system is composed of four primary layers:

1. **Input & Preprocessing Layer**
2. **Model Inference & Risk Evaluation Layer**
3. **Persistence & Reporting Layer**
4. **Visualization & Interaction Layer**

Each layer is independently testable and replaceable.

---

## 1. Input & Preprocessing Layer

This layer is responsible for preparing raw inputs into a form suitable for model inference.

### Responsibilities
- Image normalization (grayscale conversion, resizing)
- Morphological cleanup for handwritten digits
- Digit segmentation using connected components
- MNIST-style digit normalization (28×28, center-of-mass alignment)
- Region-of-interest extraction for cheque fields (amount digits, amount words)

### Technologies
- OpenCV
- NumPy
- SciPy
- PIL

This layer ensures that **input variability does not leak into model evaluation**, enabling fair benchmarking.

---

## 2. Model Inference & Risk Evaluation Layer

This is the **core intelligence layer** of Fincheck.

### Supported Model Families
- MNIST CNN variants (Baseline, KD, Pruned, Quantized, Weight Sharing, LRF)
- CIFAR CNN variants for robustness comparison

### Inference Flow
1. Batch inference using PyTorch
2. Softmax probability estimation
3. Entropy and stability computation
4. Latency measurement (per image)
5. Prediction aggregation across stress runs (for noisy datasets)

### Risk-Aware Evaluation
Instead of accuracy alone, the system computes:
- False Accept Rate (FAR)
- False Reject Rate (FRR)
- Composite Risk Score

Models are evaluated based on **safety**, not optimism.

---

## 3. Persistence & Reporting Layer

This layer provides **auditability**, a critical requirement in financial systems.

### Stored Artifacts
- Model-wise metrics
- Confusion matrices
- FAR / FRR / Risk scores
- Stress-test metadata
- Evaluation timestamps

### Features
- MongoDB-based structured storage
- Deterministic experiment replay
- PDF report generation with tables and matrices

### Technologies
- MongoDB
- ReportLab
- BSON ObjectId indexing

This enables **post-hoc analysis and compliance-friendly traceability**.

---

## 4. Visualization & Interaction Layer

The frontend provides controlled access to evaluation capabilities.

### Capabilities
- Single image digit validation
- Dataset-level benchmarking
- Stress parameter tuning
- Confidence and risk visualization
- PDF report download

### Technologies
- Next.js (Bun runtime)
- Client-side chart rendering
- Secure API interaction with FastAPI backend

The frontend is intentionally **non-authoritative** — all decisions originate from the backend.

---

## OCR & Cheque Verification Subsystem

For cheque processing, Fincheck combines:
- Classical OCR (Tesseract)
- Rule-based parsing
- YOLO-based fallback detection for amount-in-words regions

This hybrid approach minimizes silent OCR failures and increases robustness in real-world documents.

---

## Architectural Design Principles

- **Fail-safe over fail-open**
- **Reject ambiguity instead of guessing**
- **Separation of research and production logic**
- **Reproducibility-first experimentation**

---

## Summary

Fincheck’s architecture reflects the requirements of **high-risk financial systems**, where
confidence, traceability, and controlled rejection are more valuable than raw accuracy.

The design enables both **academic evaluation** and **real-world deployment readiness**.
📄 docs/evaluation-metrics.md
# Evaluation Metrics & Risk Modeling

## Motivation

In financial document processing, traditional accuracy-based evaluation is insufficient.
A single incorrect prediction can lead to financial loss, fraud, or compliance violations.

Fincheck adopts **risk-aware evaluation metrics** to explicitly quantify model safety.

---

## Core Metrics Overview

The system evaluates models using the following dimensions:

- Prediction Confidence
- Latency
- Entropy
- Stability
- False Accept Rate (FAR)
- False Reject Rate (FRR)
- Composite Risk Score

Each metric captures a different aspect of operational risk.

---

## 1. Prediction Confidence

### Definition
The maximum softmax probability assigned to a predicted class.

### Purpose
- Measures how strongly a model believes its prediction
- Used to detect low-confidence or ambiguous inputs

### Limitation
High confidence does **not** guarantee correctness, hence confidence alone is insufficient.

---

## 2. Latency

### Definition
Average inference time per image (milliseconds).

### Purpose
- Evaluates deployment feasibility
- Important for real-time cheque processing pipelines

Latency is measured **inside the inference loop** to avoid frontend bias.

---

## 3. Entropy

### Definition
Shannon entropy of the predicted probability distribution.

### Formula
H = - Σ p(x) log(p(x))


### Interpretation
- Low entropy → confident, peaked distribution
- High entropy → uncertainty or class confusion

Entropy is a direct measure of **model uncertainty**.

---

## 4. Stability

### Definition
Standard deviation of logits across the batch.

### Purpose
- Detects unstable model behavior
- Useful when comparing compressed or pruned models

Higher instability correlates with unreliable predictions.

---

## 5. False Accept Rate (FAR)

### Definition
Probability that an incorrect digit is **accepted as correct**.

### Significance
In financial systems, FAR represents **silent failure risk**.

High FAR is more dangerous than high FRR.

---

## 6. False Reject Rate (FRR)

### Definition
Probability that a correct digit is **incorrectly rejected**.

### Significance
- Impacts usability
- Acceptable to an extent in safety-critical systems

Fincheck explicitly allows higher FRR to reduce FAR.

---

## 7. Risk Score

### Definition
A weighted combination of FAR and FRR.

### Formula
Risk Score = α · FAR + β · FRR


Where:
- α, β ∈ [0, 1]
- Default: α = 0.5, β = 0.5

### Interpretation
Lower risk score indicates a **safer model**, not necessarily a more accurate one.

---

## Dataset-Level Evaluation

For noisy datasets:
- Multiple inference runs are performed
- Metrics are aggregated (mean, standard deviation)
- Confusion matrices are computed across all runs

This simulates real-world variability.

---

## Decision Thresholding

Fincheck introduces a **three-state decision model**:
- VALID (high confidence)
- AMBIGUOUS (borderline confidence)
- INVALID (low confidence)

This prevents forced predictions under uncertainty.

---

## Summary

Fincheck’s evaluation framework shifts focus from
**“How often is the model right?”**
to
**“How risky is it to trust the model?”**

This metric design aligns with real financial deployment requirements and supports both academic benchmarking and practical adoption.