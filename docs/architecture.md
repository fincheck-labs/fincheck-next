# Architecture Overview

**Fincheck — Confidence-Aware Cheque Digit Validation System**

---

## 1. Architectural Objective

Fincheck is engineered as a **risk-calibrated validation framework**, not merely a digit-recognition or OCR pipeline.
Its primary objective is to **prevent unsafe automated decisions in financial workflows** by explicitly modeling:

* Prediction confidence
* Uncertainty
* False acceptance risk
* False rejection cost

Unlike traditional accuracy-optimized systems, Fincheck is designed to:

* Detect ambiguous or structurally unsafe digits
* Reject low-confidence predictions instead of forcing classification
* Quantify operational and financial risk exposure
* Produce traceable, auditable evaluation artifacts
* Enable controlled experimentation under distribution shift

The architecture emphasizes **safety, reproducibility, interpretability, and auditability** over raw inference throughput.

---

## 2. End-to-End System Flow

```
Input Image / Dataset
        ↓
Preprocessing & Standardization
        ↓
Digit Segmentation
        ↓
MNIST-Style Canonicalization
        ↓
Multi-Model Inference
        ↓
Uncertainty & Risk Computation
        ↓
Evolutionary Risk Optimization (α Learning)
        ↓
Decision Logic (VALID / AMBIGUOUS / INVALID)
        ↓
Persistence, Reporting & Visualization
```

Each stage functions as an **explicit risk control boundary**, ensuring that ambiguity or instability does not propagate silently downstream.

---

## 3. Layered System Architecture

Fincheck follows a modular, layered architecture consisting of:

1. **Input & Preprocessing Layer**
2. **Segmentation & Canonicalization Layer**
3. **Model Inference & Risk Evaluation Layer**
4. **Evolutionary Risk Optimization Layer**
5. **Decision & Validation Layer**
6. **Persistence & Reporting Layer**
7. **Visualization & Interaction Layer**

Each layer is:

* Loosely coupled
* Independently testable
* Deterministic under controlled seeds
* Designed for research reproducibility

---

## 4. Input & Preprocessing Layer

### Purpose

To standardize raw inputs and reduce uncontrolled visual noise prior to learning-based inference.

### Responsibilities

* Grayscale conversion
* Morphological stroke enhancement
* Otsu and adaptive thresholding
* Noise suppression
* Cheque field region-of-interest extraction

### Design Philosophy

Preprocessing is treated as a **risk containment stage**, not an image beautification step.
Low-quality inputs are not artificially enhanced to inflate confidence. Instead, they are allowed to degrade into low-confidence representations, enabling safe rejection.

### Technologies

* OpenCV
* NumPy
* PIL

---

## 5. Segmentation & Canonicalization Layer

### 5.1 Digit Segmentation

Digits are extracted via connected component analysis with strict geometric filtering:

* Minimum area threshold
* Width/height constraints
* Noise rejection
* Left-to-right ordering

Components failing structural constraints are discarded early.

### 5.2 MNIST Canonicalization

Accepted components undergo strict normalization:

* Tight bounding-box cropping
* Aspect-ratio–preserving resizing
* Center placement on a 28×28 canvas
* Center-of-mass alignment

### Architectural Role

This layer enforces a **digit shape manifold prior**.
Inputs that cannot be normalized into a canonical MNIST-like representation are considered structurally unsafe and rejected before inference.

---

## 6. Model Inference & Risk Evaluation Layer

### 6.1 Multi-Model Strategy

Multiple compressed CNN variants are loaded at startup and evaluated in parallel:

* Baseline CNN
* Knowledge Distillation (KD)
* Pruned Networks
* Quantized Networks
* Low-Rank Factorized Models
* Weight Sharing Architectures

This enables **comparative risk profiling**, not single-model dependency.

### 6.2 Inference Outputs

For each model, the system computes:

* Softmax confidence (mean max probability)
* Predictive entropy
* Logit stability (variance proxy)
* Per-image latency
* Confusion matrix (when ground truth is available)

### 6.3 Risk Metrics

From confusion matrices:

* **FAR (False Accept Rate)**
* **FRR (False Reject Rate)**

Composite risk:

```
Risk = α × FAR + β × FRR
```

Where:

* α represents fraud-sensitivity weight
* β = 1 − α represents rejection-sensitivity weight

Lower risk is preferred over higher accuracy.

---

## 7. Evolutionary Risk Optimization (ERO) Layer

### Purpose

Rather than fixing α = 0.5 arbitrarily, Fincheck **learns α dynamically** using an evolutionary strategy.

This transforms model selection into a **financial policy optimization problem**.

---

### 7.1 ERO Workflow

```
Model Evaluation Results
        ↓
Extract FAR / FRR per Model
        ↓
Construct Stabilized Fitness Function
        ↓
Initialize Population (α ∈ (0,1))
        ↓
Evolution Loop:
    • Tournament Selection
    • Biased Crossover
    • Adaptive Gaussian Mutation
    • Elitism
    • Diversity Injection
    • Stagnation Recovery
    • Convergence Detection
        ↓
Optimized α*
        ↓
Risk Recalibration
        ↓
Final Model Ranking
```

---

### 7.2 Fitness Stabilization Components

The optimization objective includes:

* Relative error normalization
* Logarithmic compression
* Interior quadratic regularization
* Soft boundary barrier

These mechanisms prevent:

* Boundary collapse (α → 0 or 1)
* Metric dominance
* Numerical instability
* Degenerate policy solutions

---

### 7.3 Outputs of ERO

The optimization produces:

* Learned α* and β*
* Optimized model ranking
* Convergence history
* Fitness trajectory
* Diversity statistics
* Generation count used

ERO is computationally lightweight (O(G · P · M)) and deterministic under fixed seeds.

---

## 8. Decision & Validation Layer

Fincheck implements a **three-state decision model**:

* **VALID** — High confidence, low entropy
* **AMBIGUOUS** — Borderline confidence, requires review
* **INVALID** — Low confidence or structural failure

Decision logic integrates:

* Confidence threshold
* Ambiguity buffer window
* Structural validation
* Risk calibration

The system explicitly favors **false rejection over false acceptance**, consistent with financial safety requirements.

---

## 9. Persistence & Reporting Layer

### Purpose

To ensure full auditability and reproducibility of every experiment.

### Stored Artifacts

* Model-wise metrics
* FAR / FRR / Risk scores
* Evolutionary optimization history
* Confusion matrices
* Stress parameters
* Dataset metadata
* Timestamps

### Reporting Capabilities

* Automated PDF generation
* Tabulated metrics
* Confusion matrix visualization
* Experiment metadata embedding

### Technologies

* MongoDB (persistent experiment storage)
* BSON ObjectId indexing
* ReportLab (PDF generation)

All evaluations are reconstructable post hoc.

---

## 10. OCR & Cheque Verification Subsystem

For cheque workflows, Fincheck integrates:

* Tesseract OCR for digit and text extraction
* Rule-based numeric and word parsing
* Structured amount validation
* YOLO-based fallback detection for amount-in-words region

The hybrid architecture prevents silent OCR mismatches and improves robustness under real-world cheque variability.

---

## 11. Visualization & Interaction Layer

The frontend serves as an **experiment control interface**, not a decision authority.

### Capabilities

* Single image validation
* Dataset benchmarking
* MNIST vs CIFAR comparison
* Stress parameter tuning
* Confidence threshold adjustment
* Risk-based model sorting
* Preprocessed image preview
* PDF report export

### Architectural Constraint

All authoritative decisions originate from the backend to preserve evaluation integrity.

---

## 12. Reproducibility & Determinism

Fincheck enforces strict reproducibility via:

* Fixed random seeds
* Deterministic CUDA settings
* Explicit model loading
* Dataset version control
* MongoDB-backed experiment logging
* Controlled perturbation injection

This guarantees consistent benchmarking across runs and environments.

---

## 13. Architectural Design Principles

Fincheck is guided by the following principles:

* Safety over accuracy
* Rejection over risky prediction
* Explicit uncertainty modeling
* Explainability over opacity
* Auditability over convenience
* Research reproducibility over ad-hoc experimentation
* Policy learning over static thresholding

---

## 14. Architectural Summary

Fincheck transforms handwritten digit recognition from a classification task into a **risk-calibrated decision system**.

Its architecture integrates:

* Structured preprocessing
* Canonical digit enforcement
* Multi-model comparative inference
* Financial risk quantification
* Evolutionary policy optimization
* Audit-grade persistence

The result is a modular, conservative, and defensible framework suitable for:

* Financial document validation
* Robustness benchmarking
* Distribution-shift analysis
* Risk-aware machine learning research

Fincheck is not merely a predictor — it is a **calibrated decision engine for financial safety.**
