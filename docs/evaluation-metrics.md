
# Evaluation Metrics & Risk Modeling

---

## 1. Motivation

In financial document processing, **accuracy alone is insufficient** as an evaluation criterion.

A single incorrect digit prediction may result in:

* Fraud exposure
* Direct financial loss
* Regulatory or compliance violations
* Operational risk escalation

Traditional metrics such as classification accuracy fail to differentiate between:

* A harmless rejection
* A financially catastrophic false acceptance

Fincheck therefore adopts a **risk-aware evaluation framework** that explicitly models operational safety.

The evaluation objective shifts from:

> “How often is the model correct?”

to:

> “How risky is it to trust this model in deployment?”

---

## 2. Core Metric Dimensions

Fincheck evaluates models across multiple orthogonal dimensions:

* **Prediction Confidence**
* **Latency**
* **Entropy**
* **Stability**
* **False Accept Rate (FAR)**
* **False Reject Rate (FRR)**
* **Composite Risk Score**

Each metric captures a distinct axis of operational reliability.

---

## 3. Prediction Confidence

### Definition

The maximum softmax probability assigned to the predicted class:

[
\max_i p(y_i \mid x)
]

### Role

* Measures belief strength in the predicted class
* Identifies borderline or ambiguous inputs
* Supports confidence-based decision gating

### Limitation

Confidence is not a guarantee of correctness.
A model may be confidently wrong. Therefore, confidence must be interpreted alongside entropy and error-based risk metrics.

---

## 4. Latency

### Definition

Average inference time per image (in milliseconds).

### Role

* Evaluates deployment feasibility
* Critical for real-time cheque processing systems

Latency is measured within the backend inference loop to eliminate frontend timing bias.

---

## 5. Entropy

### Definition

Shannon entropy of the predicted class distribution:

[
H(x) = - \sum_i p(y_i \mid x) \log p(y_i \mid x)
]

### Interpretation

* **Low entropy** → peaked distribution, high certainty
* **High entropy** → dispersed probabilities, class confusion

Entropy provides a quantitative measure of predictive uncertainty and complements raw confidence.

---

## 6. Stability

### Definition

Standard deviation of model logits across the evaluation batch.

### Purpose

* Detects unstable behavior in compressed or pruned networks
* Indicates sensitivity to perturbations
* Measures robustness under stress testing

Higher instability implies fragile decision boundaries.

---

## 7. False Accept Rate (FAR)

### Definition

Probability that an incorrect digit is accepted as correct.

[
FAR = \frac{FP}{FP + TN}
]

Where:

* FP = False Positives
* TN = True Negatives

### Operational Meaning

FAR represents **silent financial risk**.

A high FAR implies:

* Fraud vulnerability
* Undetected transaction errors
* Increased regulatory exposure

In financial systems, FAR reduction is prioritized over raw accuracy improvement.

---

## 8. False Reject Rate (FRR)

### Definition

Probability that a correct digit is incorrectly rejected.

[
FRR = \frac{FN}{FN + TP}
]

Where:

* FN = False Negatives
* TP = True Positives

### Operational Meaning

FRR impacts usability and operational efficiency.
While undesirable, it is generally less catastrophic than FAR in safety-critical domains.

Fincheck intentionally tolerates moderate FRR to aggressively reduce FAR.

---

## 9. Composite Risk Score

### Baseline Definition

[
Risk = \alpha \cdot FAR + \beta \cdot FRR
]

Where:

* (\alpha \in (0,1))
* (\beta = 1 - \alpha)

Lower risk indicates safer deployment.

This formulation reflects an institutional risk posture:

* α → Fraud sensitivity
* β → Operational tolerance

---

## 10. Evolutionary Risk Optimization (ERO)

Rather than fixing (\alpha = 0.5), Fincheck learns (\alpha) dynamically using an evolutionary strategy.

### Optimization Objective

[
\alpha^* = \arg\min_{\alpha \in (0,1)}
\sum_{m=1}^{M}
\left[
\alpha \cdot FAR_m +
(1-\alpha) \cdot FRR_m
\right]
]

Where:

* (M) = number of models
* (FAR_m, FRR_m) = metrics for model (m)

---

### Stabilization Components

To prevent numerical instability and boundary collapse, the objective incorporates:

* Relative error normalization
* Logarithmic compression
* Interior quadratic regularization
* Soft boundary barrier

These ensure:

* Interior convergence (α does not collapse to 0 or 1)
* Smooth optimization surface
* Balanced financial policy calibration

---

### Outputs of ERO

The evolutionary process produces:

* Optimal risk-weight parameter (\alpha^*)
* Corresponding (\beta^* = 1 - \alpha^*)
* Risk-calibrated model ranking
* Convergence diagnostics (fitness history, alpha trajectory)

This transforms model selection into a **learned financial policy optimization problem**.

---

## 11. Dataset-Level Evaluation

For noisy or stress-tested datasets:

* Multiple inference runs are performed
* Metrics are aggregated (mean and standard deviation)
* Confusion matrices are computed across all runs

This simulates real-world variability, distribution shift, and operational uncertainty.

---

## 12. Decision Thresholding

Fincheck implements a three-state validation model:

* **VALID** — High confidence, low uncertainty
* **AMBIGUOUS** — Borderline confidence; requires review
* **INVALID** — Low confidence or structural failure

This design prevents forced predictions under uncertainty and supports human-in-the-loop review.

---

## 13. Summary

Fincheck’s evaluation framework replaces accuracy-centric benchmarking with **risk-calibrated safety modeling**.

By explicitly modeling:

* Confidence
* Entropy
* FAR / FRR
* Policy learning via α*

the system aligns evaluation with:

* Financial safety requirements
* Compliance standards
* Deployment realism

The core question becomes:

> Not “Is the model accurate?”
> But “Is the model safe to trust?”

