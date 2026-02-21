# **Fincheck — Confidence-Aware Cheque Digit Validation System**
[![Documentation](https://img.shields.io/badge/docs-live-brightgreen)](https://mukesh1352.github.io/fincheck-next/)
[![GitHub Repo](https://img.shields.io/badge/github-repo-blue)](https://github.com/mukesh1352/fincheck-next)
![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-4.x-blue?logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-teal?logo=fastapi&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-Deep%20Learning-red?logo=pytorch&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-Computer%20Vision-green?logo=opencv&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-App%20Router-black?logo=nextdotjs)
![Bun](https://img.shields.io/badge/Bun-JS%20Runtime-black?logo=bun)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-Utility--First-blue?logo=tailwindcss)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green?logo=mongodb)
![Docusaurus](https://img.shields.io/badge/Docusaurus-Docs-blue?logo=docusaurus)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Deployed-brightgreen?logo=github)

**Risk-Aware Handwritten Digit Verification for Financial Documents**

**Frontend:** Next.js (Bun)
**Backend:** FastAPI + PyTorch + OpenCV
**Storage & Reports:** MongoDB + ReportLab

---

## Abstract

Traditional OCR and digit-recognition systems optimize for accuracy and always emit a prediction. In financial workflows such as cheque processing, **a wrong prediction is more dangerous than no prediction**.

**Fincheck** reframes handwritten digit recognition as a **risk evaluation problem** rather than an accuracy problem. The system:

* Quantifies prediction confidence and uncertainty
* Computes FAR/FRR and a risk score
* Rejects ambiguous inputs instead of guessing
* Enables human-in-the-loop verification
* Provides auditability via PDF reports and database logging

Fincheck is **not an OCR engine**. It is a **confidence-aware digit validity filter** for financial systems.

In addition, Fincheck evaluates model robustness under distribution shift by
benchmarking the same compressed architectures on the CIFAR dataset.
This enables comparison between **in-distribution safety (MNIST)** and
**out-of-distribution generalization (CIFAR)**, revealing which compression
methods degrade gracefully under real-world visual complexity.

---

## Core Principle

> **If the system is not confident, it must refuse.**  
> **A model that performs well only on MNIST but collapses under CIFAR is considered unsafe for real-world deployment.**

---

# 🧠 System Architecture

---

## 🔹 System Architecture I

### Confidence-Aware Digit Validation Pipeline (MNIST Risk Filter)

```mermaid
flowchart TD
    A[User Image Upload]
    B[Preprocessing - OpenCV]
    C[Digit Segmentation]
    D[MNIST Normalization 28x28]
    E[MNIST CNN Models]
    F[Confidence Entropy Stability]
    G[FAR FRR Risk Score]
    H[VALID / AMBIGUOUS / INVALID]

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
```

### **Purpose**

Safely validate handwritten digits by rejecting low-confidence or ambiguous predictions instead of guessing.

---

## 🔹 System Architecture II

### MNIST vs CIFAR Compression Robustness Comparison

```mermaid
flowchart TD
    A[Dataset Input]
    B[Optional Stress Perturbations]
    C[Batch Inference]

    D1[MNIST Models]
    D2[CIFAR Models]

    E[Metrics Extraction]
    F[FAR FRR Risk Score]
    G[Generalization Comparison]

    A --> B
    B --> C
    C --> D1
    C --> D2
    D1 --> E
    D2 --> E
    E --> F
    F --> G
```

### **Purpose**

Compare compressed model safety under **in-distribution (MNIST)** and **out-of-distribution (CIFAR)** conditions to expose robustness gaps.

---

## 🔹 System Architecture III

### Cheque Amount Verification (Digits + Text + YOLO Fallback)

```mermaid
flowchart TD
    A[Cheque Image]
    B[OCR Full Image]
    C[Digit ROI Extraction]
    D[Digit OCR]
    E[Amount Parsing]
    F[Word to Number Conversion]
    G[Verification Logic]

    H[YOLO Detection]
    I[Retry OCR]

    A --> B
    A --> C
    C --> D
    B --> E
    D --> E
    E --> F
    F --> G

    G -->|Unverified| H
    H --> I
    I --> F
```

### **Purpose**

Verify cheque amounts by cross-checking numeric and written values with a safe fallback mechanism.

---

## 🔹 System Architecture IV

### Evolutionary Risk Weight Optimization Engine

```mermaid
flowchart TD
    A[Model Evaluation Results]
    B[Risk Metric Normalization]
    C[Fitness Function Computation]

    D[Population Initialization]
    E[Tournament Selection]
    F[Crossover Operator]
    G[Adaptive Mutation]
    H[Elite Preservation]

    I[Convergence Check]
    J[Diversity Injection]
    K[Optimized Alpha Beta]
    L[Final Risk Ranking]

    A --> B
    B --> C

    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I

    I -->|Not Converged| E
    I -->|Converged| K

    I -->|Low Diversity| J
    J --> E

    K --> L
```

### **Purpose**

Automatically learn the optimal balance between:

* FAR (False Acceptance Rate)
* FRR (False Rejection Rate)

Instead of manually selecting risk weights, the system evolves alpha (α) using an adaptive genetic strategy.

---

## Why MNIST Is Used

MNIST is not used to recognize cheques.
It serves as a **digit shape manifold prior**.

Digits that do not resemble canonical handwritten digits result in:

* Low confidence
* High entropy
* Automatic rejection

MNIST acts as a **risk filter**, not an OCR system.

CIFAR is intentionally more complex and visually diverse than MNIST.
While MNIST measures digit plausibility and safety, CIFAR is used to
evaluate how compression techniques generalize under higher visual entropy.

A safe model should perform well on MNIST and degrade gracefully on CIFAR.
CIFAR results are interpreted only after MNIST acceptance, never as a standalone decision signal.

---

## Digit Segmentation Pipeline

1. Grayscale conversion
2. Stroke enhancement (morphological close)
3. Otsu thresholding and inversion
4. Connected component extraction
5. Geometric filtering (area, width, height)
6. Left-to-right ordering
7. MNIST normalization:

   * Tight crop
   * Aspect-ratio safe resize
   * 28×28 canvas
   * Center-of-mass alignment

Segmentation is treated as a **risk control stage**. Borderline components are rejected.

## Multi-Model Inference

All models are loaded at startup and evaluated in parallel:

| Model               | Technique              |
| ------------------- | ---------------------- |
| baseline_mnist.pth  | Standard CNN           |
| kd_mnist.pth        | Knowledge Distillation |
| lrf_mnist.pth       | Low Rank Factorization |
| pruned_mnist.pth    | Weight Pruning         |
| quantized_mnist.pth | Quantization           |
| ws_mnist.pth        | Weight Sharing         |

This allows model comparison using **risk metrics**, not just accuracy.

The same compression techniques are mirrored for CIFAR:

| Model               | Dataset | Purpose                    |
|--------------------|---------|----------------------------|
| baseline_cifar.pth | CIFAR   | Generalization baseline    |
| kd_cifar.pth       | CIFAR   | Distilled robustness test  |
| lrf_cifar.pth      | CIFAR   | Low-rank stress behavior   |
| pruned_cifar.pth   | CIFAR   | Sparsity degradation test  |
| quantized_cifar.pth| CIFAR   | Precision sensitivity test |
| ws_cifar.pth       | CIFAR   | Shared-weight robustness   |

MNIST and CIFAR results are never merged; they are compared to expose
robustness gaps introduced by compression.

---

## Risk Metrics

Fincheck evaluates models using:

* **Confidence** — mean max softmax probability
* **Entropy** — prediction uncertainty
* **Stability** — logit variance
* **Latency** — inference time
* **FAR** — False Accept Rate
* **FRR** — False Reject Rate

**Risk Score**

```
Risk = 0.5 × FAR + 0.5 × FRR
```

Lower risk score is preferred over higher accuracy.

---
# Evolutionary Risk Optimization Framework
---

## 1. Why This Exists (Simple Explanation)

Most machine learning systems choose the “best” model using **accuracy**.

In financial systems, this is dangerous.

Two models can both have 98% accuracy, but:

* One may wrongly accept fraudulent digits (high FAR → fraud risk)
* Another may wrongly reject valid digits (high FRR → operational friction)

In cheque verification, **a wrong acceptance can cost money**.
A wrong rejection only causes inconvenience.

Therefore, Fincheck does not select models by accuracy.
It selects models by **financial risk calibration**.

To do this, it learns how much importance to give to:

* Fraud prevention (FAR)
* Operational smoothness (FRR)

This importance weight is called: **alpha**

And instead of choosing it manually, Fincheck **learns it automatically using an Evolutionary Algorithm**.

---

## 2. What Is Being Optimized?

For each model ( m ), we define a weighted financial risk:
```
R_m(alpha) = alpha · FAR_m + (1 - alpha) · FRR_m
```

Where:

* FAR = False Accept Rate (fraud risk)
* FRR = False Reject Rate (operational rejection cost)
- alpha ∈ (0, 1), where alpha is the risk weighting parameter  
- beta = 1 − alpha

In simple words:

If alpha is high → system prioritizes fraud prevention
If alpha is low → system prioritizes reducing rejections

The goal is:
```
alpha* = argmin ( Σ_m R_m(alpha) ),  where alpha ∈ (0,1)
```

Meaning:

Find the alpha value that minimizes total financial risk across all models.

---

## 3. Why Not Just Use Alpha = 0.5?

Because:

* Different datasets behave differently
* Different stress conditions change risk behavior
* Some models are FAR-heavy, some FRR-heavy
* A fixed 50-50 policy may be suboptimal

So instead of hardcoding policy, Fincheck **learns the safest policy from data**.

This makes the system:

* Adaptive
* Data-driven
* Reproducible
* Auditable

---

## 4. What Is an Evolutionary Algorithm? (Simple Explanation)

An Evolutionary Algorithm is inspired by natural selection.

It works like this:

1. Start with random candidate solutions (alpha values).
2. Evaluate how good each one is (fitness).
3. Keep the best ones.
4. Combine them (crossover).
5. Slightly modify them (mutation).
6. Repeat until improvement stops.

It automatically searches for the safest financial weighting.

---

## 5. Representation (What Is Evolving?)

Each individual in the population is simply:

[
\alpha \in (0,1)
]

Example:

```
Generation 1:
[0.12, 0.48, 0.63, 0.29, 0.81, ...]
```

Each number represents a different financial policy.

---

## 6. Fitness Function (Exact Backend Logic)

A naïve linear risk:
```
Risk(alpha) = alpha * FAR + (1 - alpha) * FRR
```
Where:

FAR = False Accept Rate

FRR = False Reject Rate

alpha ∈ (0,1)

can collapse to extreme solutions (0 or 1).

To prevent instability, Fincheck applies:

---

### 6.1 Normalization

For each model:
```
FAR_n = FAR / (FAR + FRR)
```
- Removes magnitude dominance between FAR and FRR.
```
FRR_n = FRR / (FAR + FRR)
```
- Ensures FAR and FRR are scale-balanced.
- 
Why?

To prevent one metric from dominating purely due to scale.

---

### 6.2 Log Compression

Instead of linear weighting:
```
alpha * log(FAR_n + epsilon) + (1 - alpha) * log(FRR_n + epsilon)
```
Where:

- epsilon = small constant (1e-8) for numerical stability

-log() smooths extreme dominance

Why?

* Reduces extreme domination
* Smooths optimization landscape
* Stabilizes evolution

The negative sum becomes the minimization objective.

---

### 6.3 Interior Regularization
```
(alpha - 0.5)^2
```
Encourages balanced solutions.
Prevents full collapse to fraud-only or reject-only policy.

---

### 6.4 Soft Boundary Barrier
```
0.05 / alpha + 0.05 / (1 - alpha)
```

Prevents alpha from becoming exactly 0 or 1.

Why?

Because extreme policies are financially unsafe.

---

### Final Fitness Used in Code

```
Fitness(alpha) =- sum_over_models [ alpha * log(FAR_n + epsilon) + (1 - alpha) * log(FRR_n + epsilon) ] + (alpha - 0.5)^2 + (0.05 / alpha + 0.05 / (1 - alpha))
```

Lower fitness = safer financial calibration.

---

## 7. Evolutionary Mechanics (How It Works)

### 7.1 Tournament Selection (k = 3)

* Randomly pick 3 candidates
* Keep the best
* Repeat

Why?

Maintains diversity while favoring better solutions.

---

### 7.2 Crossover

```
child = 0.7 * better_parent + 0.3 * other_parent
```

Why?

Smooth interpolation between financial policies.

---

### 7.3 Mutation

Mutation equation:

```
alpha' = alpha + N(0, sigma)
```

Sigma decreases over generations:

Early → exploration
Late → fine tuning

Mutation rate = 15%

---

### 7.4 Elitism

Top 4 individuals survive unchanged.

Why?

Prevents losing best solution.

---

### 7.5 Diversity Injection

If population becomes too similar:

Inject random alphas.

Prevents local minima.

---

### 7.6 Stagnation Recovery

If no improvement for multiple generations:

Force additional mutation.

Restores exploration.

---

### 7.7 Adaptive Stopping

Stop when:

* Improvement is below tolerance
* AND stagnation persists

No fixed generation count.

Stops when converged.

---

## 8. What Does the Algorithm Output?

```json
{
  "alpha": 0.72,
  "beta": 0.28,
  "best_model": "kd_mnist.pth",
  "history": {...},
  "generations_used": 37
}
```

The model minimizing:
```
R_opt = alpha* · FAR + (1 - alpha*) · FRR
```
gets the **Evolution Best** badge.

---

## 9. What Does Alpha Mean Financially?

| Alpha Value | Interpretation                |
| ----------- | ----------------------------- |
| 0.0         | Reject-focused (minimize FRR) |
| 1.0         | Fraud-focused (minimize FAR)  |
| 0.5         | Balanced policy               |

Alpha is not a hyperparameter.
It is a learned financial policy indicator.

---

## 10. Why This Is Safer Than Accuracy Ranking

Accuracy ignores:

* Fraud exposure
* Rejection friction
* Risk trade-offs
* Financial weighting

Evolutionary risk calibration:

* Learns optimal safety balance
* Avoids extreme bias
* Adapts to dataset
* Produces explainable policy

---

## 11. Computational Complexity

If:

* P = population size
* G = generations used
* M = number of models

Time complexity:

```
Computational Complexity: O(G × P × M)
```
This means the algorithm’s runtime grows proportionally with:
- The number of generations (G)
- The number of candidate alpha values per generation (P)
- The number of models being evaluated (M)

Since alpha is scalar, optimization is lightweight and fast.

---

## 12. Final Conceptual Summary

Fincheck transforms model selection from:

"Which model is most accurate?"

to:

"Which model minimizes calibrated financial risk under a learned safety policy?"

This makes the system:

* Risk-aware
* Financially defensible
* Adaptive
* Explainable
* Research-grade
* Production-safe

---
## Stress Testing (Cheque Simulation)

Runtime perturbations simulate real cheque conditions:

| Parameter | Effect              |
| --------- | ------------------- |
| Blur      | Camera focus issues |
| Rotation  | Skewed scan         |
| Noise     | Sensor noise        |
| Erase     | Ink loss            |

Used in `/run` and `/run-dataset`.

The same perturbations are applied to CIFAR to analyze whether compression-induced failures amplify under visual complexity.

---

## API Endpoints

| Endpoint                  | Purpose                        |
| ------------------------- | ------------------------------ |
| `POST /verify-digit-only` | Image-only digit validation    |
| `POST /verify`            | OCR vs typed text validation   |
| `POST /run`               | Single image stress test       |
| `POST /run-dataset`       | Dataset benchmarking           |
| `POST /export-pdf`        | Generate PDF evaluation report |
| `GET /export/pdf/{id}`    | Rebuild report from database   |
| `GET /compare/{id}` | MNIST vs CIFAR model comparison |

---

## PDF Reporting & Logging

Each export:

* Stores experiment results in MongoDB
* Generates a PDF with:

  * Metrics table
  * Confusion matrices
  * Experiment metadata

Ensures auditability and reproducibility.

---

## Frontend as Experiment Control Panel

The UI is designed for experimentation:

* Confidence threshold slider
* Noise / perturbation sliders
* Model selection
* Dataset sampling
* Preprocessed image preview
* Model sorting by risk / latency / confidence
* Experiment presets
* MNIST vs CIFAR comparison dashboard
* Delta visualization (accuracy, latency, risk)
* Dataset-level winner identification
* Compression generalization ranking

---

## Technology Stack

### Frontend

* Next.js (App Router)
* TypeScript
* Tailwind CSS
* Bun

### Backend

* FastAPI
* PyTorch
* OpenCV
* NumPy / SciPy
* Tesseract (for `/verify`)
* MongoDB
* ReportLab

---

## Project Structure

```
fincheck/
├── fintech-backend/
│   ├── server.py
│   ├── model_def.py
│   ├── model/
│   ├── data/
│   └── requirements.txt
│
├── fintech-frontend/
│   ├── app/
│   ├── components/
│   └── package.json
```

---

## Setup Instructions

### 1. Prerequisites

Install:

* Python 3.10+
* Node.js 18+
* Bun
* MongoDB Atlas account
* Tesseract OCR

#### Install Bun

```bash
curl -fsSL https://bun.sh/install | bash
```

Verify:

```bash
bun --version
```

#### Install Tesseract

**Ubuntu**

```bash
sudo apt install tesseract-ocr
```

**Mac**

```bash
brew install tesseract
```

---

## Backend Setup (FastAPI)

```bash
cd fintech-backend

python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate

pip install -r requirements.txt
pip install scipy
```

Create `.env`:

```
MONGODB_URI=your_mongodb_connection_string
```

Download MNIST models into `model/`.

Run server:

```bash
uvicorn server:app --reload --port 8000
```

---

## Frontend Setup (Next.js + Bun)

```bash
cd fintech-frontend

bun install
bun run dev
```

App runs at:

```
http://localhost:3000
```

---

## Reproducibility Features

* Fixed random seeds for perturbations
* Deterministic CUDA settings
* MongoDB experiment logging
* PDF report generation
* Explicit model selection

---

## Intended Use Cases

* Cheque digit validation
* Account number verification
* Amount field verification
* Human-in-the-loop financial review systems
* ML robustness research
* Risk-aware ML demonstrations
* Compression robustness and generalization analysis

---

## Design Philosophy

Fincheck prioritizes:

* Safety over accuracy
* Rejection over risky prediction
* Explainability over opacity
* Auditability over convenience

---

## License

For academic, research, and demonstration purposes only.

---

## Contributors

| Name   | Focus                                      |
| ------ | ------------------------------------------ |
| Mukesh | UI controls, decision logic, visualization |
| Albert | Metrics, ground truth, validation          |
| Rathna | Perturbations, preprocessing, datasets     |
| Vikas  | Experiment management, exports, presets    |

---

**Fincheck is not an OCR demo.**
It is a **risk-aware digit validation framework for financial systems.**

- API Specification → [`docs/api-spec.md`](docs/api-spec.md)
- Architecture Overview → [`docs/architecture.md`](docs/architecture.md)
- Evaluation Metrics → [`docs/evaluation-metrics.md`](docs/evaluation-metrics.md)
