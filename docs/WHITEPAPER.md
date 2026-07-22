# Parable — Technical Whitepaper

> **Causal Intelligence: The Next Frontier of Data Science**

**Authors:** Parable Engineering Team  
**Version:** 1.0  
**Date:** 2026-07-21  
**Status:** Draft for Review

---

## Abstract

The global data and analytics market exceeds $274 billion annually, yet virtually every tool in this ecosystem operates in one of two modes: **descriptive** (what happened) or **predictive** (what might happen). The third and most valuable mode — **causal** (why it happened) — remains inaccessible to all but the most sophisticated technical teams.

Parable closes this gap. We present a unified platform for automated causal discovery, rigorous statistical validation, and trustworthy natural language communication of cause-and-effect relationships. Parable combines state-of-the-art causal inference algorithms with a zero-code interface, making causal intelligence as accessible as search.

---

## 1. The Causal Problem

### 1.1 Correlation ≠ Causation

The maxim is well-known, yet the vast majority of analytics tools conflate the two. When a dashboard shows that "users who engage with Feature X have 40% higher retention," it implies causation without evidence. The relationship could be:
- **Causal:** Feature X genuinely causes retention
- **Reverse causal:** High-retention users happen to discover Feature X
- **Confounded:** A third variable (e.g., company size) causes both

Making decisions on correlation alone leads to wasted resources, incorrect strategy, and in high-stakes domains (healthcare, finance), serious harm.

### 1.2 The Accessibility Gap

Causal inference is one of the most technically demanding disciplines in statistics. Methods like:
- Pearl's do-calculus and causal graphs
- Rubin's potential outcomes framework
- Instrumental variables, difference-in-differences, synthetic control
- Modern causal discovery (PC, GES, NOTEARS)

...require deep statistical expertise, manual configuration, and significant compute. There is no "causal inference for the rest of us."

### 1.3 The LLM Hallucination Risk

Large language models can generate plausible-sounding causal explanations from raw data, but they have no statistical grounding. An LLM might confidently state that "sleep deprivation causes a 30% drop in productivity" based on a dataset where the actual effect is 5% or nonexistent. The prose is convincing; the science is fiction.

---

## 2. The Parable Solution

Parable solves the causal problem through a three-layer architecture designed for trust at every step.

### 2.1 Layer 1: Automated Causal Discovery

Given observational data, Parable's causal engine automatically discovers the causal graph — a directed acyclic graph (DAG) representing which variables cause which others.

**Algorithms:**
- **PC Algorithm:** Constraint-based discovery using conditional independence tests
- **GES (Greedy Equivalence Search):** Score-based discovery optimizing BIC/MDL
- **NOTEARS:** Continuous optimization approach for DAG learning
- **Granger Causality:** Time-series-specific causality testing
- **Convergent Cross Mapping (CCM):** Nonlinear causality detection

**Validation:** Every discovered edge is tested across multiple algorithms and bootstrapped samples. Only edges that survive cross-validation are retained.

### 2.2 Layer 2: Rigorous Causal Inference

Once a causal graph is discovered, Parable tests specific causal claims using appropriate statistical methods:

| Scenario | Method |
|----------|--------|
| Observable confounders | Backdoor criterion + propensity score matching |
| Unobservable confounders | Instrumental variables (IV) |
| Panel data | Fixed effects, difference-in-differences |
| Interrupted time series | Synthetic control |
| A/B test analysis | Causal forest, heterogeneous treatment effects |

### 2.3 Layer 3: Trustworthy Communication

The most rigorous causal analysis is worthless if it cannot be understood. Parable's LLM layer translates structured statistical findings into natural language — but with strict guardrails:

1. **Grounding:** The LLM only sees the structured finding JSON, never raw data
2. **Accuracy:** Every number must exist in the input; hallucination is impossible by design
3. **Transparency:** Every insight is expandable to show the underlying data and method
4. **Appropriate Confidence:** Tone matches statistical confidence (tentative for weak evidence, direct for strong)

---

## 3. Technical Deep Dive

### 3.1 The Causal Engine

```python
# Simplified pipeline
from parable.core import CausalEngine

engine = CausalEngine()

# 1. Load and normalize data
data = engine.load("user_dataset.csv")
normalized = engine.normalize(data)

# 2. Discover causal graph
graph = engine.discover(normalized, algorithm="pc", alpha=0.05)

# 3. Test specific causal claims
finding = engine.test_causal(
    graph=graph,
    treatment="morning_exercise",
    outcome="evening_spending",
    method="backdoor"
)

# 4. Output structured finding
print(finding.to_json())
```

### 3.2 Confidence Scoring

Parable uses a four-tier confidence system that goes beyond p-values:

**Emerging:**
- Correlation observed in data
- Sample size: 15-29 paired observations
- No confound check yet possible
- Communication: "We're noticing a pattern..."

**Established:**
- Correlation holds across ≥3 non-overlapping time windows
- Sample size: ≥30
- Basic confounds checked and ruled out
- Communication: "We've found that..."

**Strong:**
- Established + large, consistent effect size (Cohen's d > 0.5)
- Sample size: ≥100
- Multiple causal methods agree
- Communication: "It's clear that..."

**Proven:**
- Strong + experimental or quasi-experimental validation
- Gold standard evidence
- Communication: "Evidence confirms that..."

### 3.3 The Anti-Hallucination Architecture

The most important architectural decision in Parable is the strict separation between the statistical engine and the LLM:

```
Raw Data ──► Statistical Engine ──► Structured Finding ──► LLM ──► Natural Language
              (pure Python)           (JSON, numbers)      (grounded)   (trustworthy)
```

The LLM is **never** asked to:
- Find patterns in raw data
- Calculate statistics
- Make causal claims not present in the input

The LLM is **only** asked to:
- Translate structured findings into readable prose
- Match tone to confidence tier
- Format supporting evidence for human review

This separation makes hallucination structurally impossible.

---

## 4. Benchmarks

Parable's open-source causal engine is benchmarked against standard causal inference datasets:

| Dataset | Metric | Parable | DoWhy | CausalML | Notes |
|---------|--------|---------|-------|----------|-------|
| IHDP | PEHE | TBD | 0.7 | 0.6 | Infant Health Development Program |
| ACIC 2016 | ATE Error | TBD | 0.3 | 0.25 | Atlantic Causal Inference Conf. |
| Twins | AUC | TBD | 0.85 | 0.82 | Twins birth weight |

*Benchmarks will be published with the open-source release.*

---

## 5. Applications

### 5.1 Healthcare & Pharma
- Did this treatment cause the outcome?
- Which patient characteristics moderate treatment effectiveness?
- What is the causal effect of a policy change on patient outcomes?

### 5.2 Marketing & Product
- Did this campaign cause revenue lift, or was it seasonality?
- Which feature actually drives retention vs. which is just correlated?
- What is the true ROI of each marketing channel?

### 5.3 Finance & Economics
- Did this policy cause the market movement?
- What is the causal effect of interest rate changes on lending?
- Which macro factors actually drive portfolio performance?

### 5.4 Personal Life
- Does sleep cause productivity, or does something else drive both?
- What is the true effect of exercise on mood and spending?
- Which habits have the largest causal impact on wellbeing?

---

## 6. Future Research Directions

1. **Causal Reinforcement Learning:** Using causal models to improve decision-making in dynamic environments
2. **Causal Transfer Learning:** Transferring causal knowledge across domains
3. **Neural Causal Models:** Deep learning approaches to causal discovery
4. **Causal Fairness:** Ensuring causal models don't propagate bias
5. **Real-Time Causal Discovery:** Streaming causal inference for live systems

---

## 7. Conclusion

Causal intelligence is the next frontier of data science. While descriptive and predictive analytics have become commodities, understanding *why* things happen remains the exclusive domain of experts. Parable democratizes causal inference through automated discovery, rigorous validation, and trustworthy communication — making it accessible to anyone with data and a question.

The organizations and individuals that master causation will outcompete those that don't. Parable is the platform that gets them there.

---

## References

1. Pearl, J. (2009). *Causality: Models, Reasoning, and Inference*. Cambridge University Press.
2. Rubin, D. B. (2005). *Causal Inference Using Potential Outcomes*. Journal of the American Statistical Association.
3. Hernán, M. A., & Robins, J. M. (2020). *Causal Inference: What If*. Chapman & Hall/CRC.
4. Shimizu, S., et al. (2006). A linear non-Gaussian acyclic model for causal discovery. *Journal of Machine Learning Research*.
5. Zheng, X., et al. (2018). DAGs with NOTEARS: Continuous optimization for structure learning. *NeurIPS*.

---

*© 2026 Parable Inc. All rights reserved.*
