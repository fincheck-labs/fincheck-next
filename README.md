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
````

**Purpose:**
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
flowchart LR
    A[Initialize α Population]
    B[Evaluate Risk Fitness]
    C[Tournament Selection]
    D[Crossover]
    E[Mutation]
    F[Elitism]
    G[Convergence Check]

    A --> B --> C --> D --> E --> F --> G
    G -->|Not Converged| B
**Purpose:**
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
Evolutionary Risk Optimization Framework
1. Motivation

Traditional model selection relies on accuracy.
However, in financial systems, accuracy alone is insufficient.

Two models can have identical accuracy but drastically different:

False Accept Rates (FAR)

False Reject Rates (FRR)

In cheque validation systems:

False Accept (FAR) → Fraud risk

False Reject (FRR) → Operational friction

Therefore, Fincheck does not select models based on accuracy.

Instead, it formulates model selection as a continuous risk optimization problem.

2. Risk Formulation

For each model 
𝑚
m:

𝑅
𝑚
(
𝛼
)
=
𝛼
⋅
𝐹
𝐴
𝑅
𝑚
+
(
1
−
𝛼
)
⋅
𝐹
𝑅
𝑅
𝑚
R
m
	​

(α)=α⋅FAR
m
	​

+(1−α)⋅FRR
m
	​


Where:

𝐹
𝐴
𝑅
𝑚
FAR
m
	​

 = False Accept Rate

𝐹
𝑅
𝑅
𝑚
FRR
m
	​

 = False Reject Rate

𝛼
∈
(
0
,
1
)
α∈(0,1) = safety weighting parameter

𝛽
=
1
−
𝛼
β=1−α

This creates a weighted financial risk score.

3. Why Alpha Must Be Learned

Choosing α manually is:

Arbitrary

Policy-dependent

Dataset-dependent

Potentially biased

Instead of fixing α = 0.5,
Fincheck learns α automatically using a Genetic Algorithm (GA).

This makes risk calibration:

Data-driven

Adaptive

Reproducible

Explainable

Genetic Algorithm for Risk Calibration
4. Optimization Objective

We seek:

𝛼
∗
=
arg
⁡
min
⁡
𝛼
∈
(
0
,
1
)
∑
𝑚
𝑅
𝑚
(
𝛼
)
α
∗
=arg
α∈(0,1)
min
	​

m
∑
	​

R
m
	​

(α)

Meaning:

Find the α that minimizes total weighted risk across all models.

This converts model comparison into a continuous evolutionary optimization problem.

5. Representation

Each individual in the population represents:

𝛼
∈
(
0
,
1
)
α∈(0,1)

Population example:

Generation 1:
[0.12, 0.48, 0.63, 0.29, 0.81, ...]

Each α value is evaluated using the defined fitness function.

6. Fitness Function (Research-Grade Explanation)

The raw risk is:

𝑅
(
𝛼
)
=
𝛼
𝐹
𝐴
𝑅
+
(
1
−
𝛼
)
𝐹
𝑅
𝑅
R(α)=αFAR+(1−α)FRR

However, naïve linear risk leads to:

Extreme solutions (α = 0 or 1)

Numerical instability

Dominance from scaled metrics

Therefore, Fincheck uses:

6.1 Normalization
𝐹
𝐴
𝑅
𝑛
=
𝐹
𝐴
𝑅
𝐹
𝐴
𝑅
+
𝐹
𝑅
𝑅
FAR
n
	​

=
FAR+FRR
FAR
	​

𝐹
𝑅
𝑅
𝑛
=
𝐹
𝑅
𝑅
𝐹
𝐴
𝑅
+
𝐹
𝑅
𝑅
FRR
n
	​

=
FAR+FRR
FRR
	​


This removes magnitude bias.

6.2 Log Compression
𝛼
log
⁡
(
𝐹
𝐴
𝑅
𝑛
)
+
(
1
−
𝛼
)
log
⁡
(
𝐹
𝑅
𝑅
𝑛
)
αlog(FAR
n
	​

)+(1−α)log(FRR
n
	​

)

Log compression:

Reduces domination by outliers

Improves smoothness of search surface

6.3 Regularization
𝜆
(
𝛼
−
0.5
)
2
λ(α−0.5)
2

Encourages interior solutions.

Prevents overfitting toward:

Pure FAR minimization

Pure FRR minimization

6.4 Soft Barrier
𝛾
𝛼
+
𝛾
1
−
𝛼
α
γ
	​

+
1−α
γ
	​


Prevents α from becoming:

Exactly 0

Exactly 1

This ensures:

• Numerical stability
• Financial safety balance

Final Fitness
𝐹
𝑖
𝑡
𝑛
𝑒
𝑠
𝑠
(
𝛼
)
=
−
∑
𝑚
[
𝛼
log
⁡
(
𝐹
𝐴
𝑅
𝑛
)
+
(
1
−
𝛼
)
log
⁡
(
𝐹
𝑅
𝑅
𝑛
)
]
+
𝜆
(
𝛼
−
0.5
)
2
+
Barrier
Fitness(α)=−
m
∑
	​

[αlog(FAR
n
	​

)+(1−α)log(FRR
n
	​

)]+λ(α−0.5)
2
+Barrier

Lower fitness = safer calibration.

Evolutionary Terminology Explained
7. Generation

A generation consists of:

Evaluate all α candidates

Select parents

Apply crossover

Apply mutation

Preserve elite

Replace population

Each generation refines the α distribution.

8. Population

Population size = 20 (default)

Represents diversity of α candidates.

Large population:

More exploration

Slower convergence

Small population:

Faster convergence

Risk of local minima

9. Tournament Selection (k=3)

Instead of global best selection:

Randomly pick 3 individuals

Select the best among them

Repeat for second parent

Advantages:

Maintains diversity

Avoids premature convergence

Stochastic pressure control

10. Crossover (Biased Recombination)

Child generation:

𝑐
ℎ
𝑖
𝑙
𝑑
=
0.7
⋅
𝑏
𝑒
𝑡
𝑡
𝑒
𝑟
_
𝑝
𝑎
𝑟
𝑒
𝑛
𝑡
+
0.3
⋅
𝑜
𝑡
ℎ
𝑒
𝑟
_
𝑝
𝑎
𝑟
𝑒
𝑛
𝑡
child=0.7⋅better_parent+0.3⋅other_parent

This:

Encourages exploitation of good solutions

Preserves genetic diversity

Smoothly interpolates α values

11. Mutation

Mutation introduces Gaussian noise:

𝛼
′
=
𝛼
+
𝑁
(
0
,
𝜎
)
α
′
=α+N(0,σ)

Where:

𝜎
=
𝜎
𝑏
𝑎
𝑠
𝑒
⋅
(
1
−
𝑔
𝑒
𝑛
𝑒
𝑟
𝑎
𝑡
𝑖
𝑜
𝑛
𝑚
𝑎
𝑥
_
𝑔
𝑒
𝑛
𝑒
𝑟
𝑎
𝑡
𝑖
𝑜
𝑛
𝑠
)
σ=σ
base
	​

⋅(1−
max_generations
generation
	​

)

Meaning:

Early → exploration
Late → fine-tuning

Mutation prevents stagnation.

12. Elitism

Top 4 individuals are preserved unchanged.

Guarantees:

Best solution is never lost

Monotonic convergence behavior

13. Diversity Pressure

If:

𝑠
𝑡
𝑑
(
𝑝
𝑜
𝑝
𝑢
𝑙
𝑎
𝑡
𝑖
𝑜
𝑛
)
<
𝑡
ℎ
𝑟
𝑒
𝑠
ℎ
𝑜
𝑙
𝑑
std(population)<threshold

Then:

Inject random α values.

Prevents:

Population collapse

Local minimum entrapment

14. Stagnation Recovery

If no improvement for N generations:

Apply extra mutation

Reset stagnation counter

Ensures continuous exploration.

15. Adaptive Termination

Instead of fixed generations:

Stop when:

∣
𝐹
𝑖
𝑡
𝑛
𝑒
𝑠
𝑠
𝑛
𝑒
𝑤
−
𝐹
𝑖
𝑡
𝑛
𝑒
𝑠
𝑠
𝑜
𝑙
𝑑
∣
<
𝜖
∣Fitness
new
	​

−Fitness
old
	​

∣<ϵ

AND stagnation persists.

This makes evolution:

Data-adaptive

Efficient

Stable

Output Interpretation

The algorithm returns:

{
  alpha,
  beta,
  best_model,
  optimized_scores,
  history: {
      alpha trajectory,
      fitness trajectory
  }
}

The model minimizing:

𝛼
∗
𝐹
𝐴
𝑅
+
(
1
−
𝛼
∗
)
𝐹
𝑅
𝑅
α
∗
FAR+(1−α
∗
)FRR

receives the 🚀 Evolution Best badge.

Relationship to Pareto Frontier

Pareto analysis optimizes:

Accuracy

Risk

Evolution optimizes:

Weighted risk only

If a model:

• Lies on Pareto frontier
• Minimizes evolved risk

It is considered globally optimal under safety objectives.

Financial Interpretation of Alpha
Alpha Value	Interpretation
α ≈ 0	Reject-heavy system (minimize FRR)
α ≈ 1	Fraud-sensitive system (minimize FAR)
α ≈ 0.5	Balanced risk

Alpha is not a hyperparameter.
It is a learned financial policy indicator.

Computational Complexity

For:

Population = P

Generations = G

Models = M

Time Complexity:

𝑂
(
𝐺
⋅
𝑃
⋅
𝑀
)
O(G⋅P⋅M)

Since α is scalar, search is lightweight.

Why Evolution Instead of Grid Search?
Grid Search	Genetic Algorithm
Discrete	Continuous
Rigid	Adaptive
No diversity	Diversity control
Manual stopping	Convergence detection
No memory	Elite preservation

Evolution is better suited for:

Non-convex risk surfaces

Financial calibration

Robust safety tuning

Safety Implications

The evolutionary calibration ensures:

• No extreme bias toward FAR or FRR
• Adaptive risk weighting per dataset
• Controlled financial exposure
• Explainable policy tuning

Conceptual Summary

Fincheck’s Evolutionary Risk Optimization:

Transforms model comparison from:

“Which model is most accurate?”

to

“Which model minimizes calibrated financial risk under learned safety policy?”

This makes Fincheck:

• Risk-aware
• Policy-adaptive
• Reproducible
• Financially defensible

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
