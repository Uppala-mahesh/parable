# Parable — Product Requirements Document

> **The World's First Causal Intelligence Operating System**
>
> *Not dashboards. Not predictions. Truth.*

**Version:** 1.0 — Foundation  
**Status:** Pre-Build / Architecture Phase  
**Classification:** Confidential — Internal Use Only

---

## 1. Executive Summary

Parable is a causal intelligence platform that discovers, validates, and communicates cause-and-effect relationships across any dataset. Where traditional analytics tells you *what happened* and AI tells you *what might happen*, Parable tells you **why it happens** — with statistical rigor, transparent confidence tiers, and zero hallucination.

**The $100B Opportunity:** Enterprises spend $274B annually on analytics and BI tools that describe the past, and another $200B+ on AI that predicts the future. Almost nothing credible exists for understanding *causation* — the single most valuable question in business, healthcare, finance, and human life.

**Core Thesis:** Causal understanding is the last unsolved frontier of data science. Parable owns it.

---

## 2. Problem Statement

### 2.1 The Causal Gap

Every organization faces the same unanswerable questions:
- **Healthcare:** Did this drug *cause* the improvement, or did patients improve regardless?
- **Marketing:** Did this campaign *cause* the revenue lift, or was it seasonality?
- **Finance:** Did this policy *cause* the market move, or was it a confounding macro event?
- **Personal:** Does my sleep *cause* my productivity, or does something else drive both?

Current tools fail because:
1. **BI / Dashboards** describe correlations, not causation
2. **ML / Predictive AI** optimizes for prediction accuracy, not causal truth
3. **Academic causal inference** (DoWhy, CausalML) requires PhD-level expertise and manual configuration
4. **LLMs** hallucinate causal claims with confident-sounding prose

### 2.2 Why Now

- **Data abundance:** Organizations have more data than ever
- **LLM maturity:** Natural language interfaces are now possible
- **Compute cost collapse:** Causal discovery algorithms are now economically viable at scale
- **Regulatory pressure:** EU AI Act, FDA, and others increasingly demand causal evidence for high-stakes decisions
- **Trust crisis:** Users and regulators no longer accept black-box predictions without explanation

---

## 3. Vision

> **Parable makes causal intelligence as accessible as search.**

Any person or organization should be able to connect their data, ask "why," and receive a statistically defensible, transparently caveated answer — without a PhD, without writing code, and without trusting a black box.

**Three Pillars:**
1. **Discover** — Algorithmically discover causal relationships in data
2. **Validate** — Rigorously test claims with appropriate statistical methods
3. **Communicate** — Translate findings into natural language anyone can understand and trust

---

## 4. Product Lines

### 4.1 Parable Personal (Consumer — Correlate Reimagined)
*Your personal causal-insight engine. Not another dashboard — a system that tells you what's actually causing what in your own life.*

- Connects personal data streams (health, calendar, spending, mood, screen time)
- Surfaces specific, falsifiable, honestly-caveated causal insights
- Built on the same engine that powers enterprise deployments
- Freemium model; premium for advanced integrations and deeper history

### 4.2 Parable Enterprise (B2B SaaS)
*Causal intelligence for organizations that make high-stakes decisions.*

- **Marketing Mix Modeling:** "Did this campaign cause revenue lift?"
- **Product Analytics:** "Did this feature cause retention improvement?"
- **Supply Chain:** "Did this supplier change cause quality degradation?"
- **Healthcare / Pharma:** "Did this treatment cause the outcome?"
- **Finance / Risk:** "Did this policy cause the portfolio shift?"

### 4.3 Parable API (Developer Platform)
*Embed causal intelligence into any application.*

- RESTful and GraphQL APIs
- SDKs for Python, TypeScript, Go, Java
- Usage-based pricing
- White-label capabilities

### 4.4 Parable Research (Academic / Open Source)
*Advancing the science of causal discovery.*

- Open-source core causal engine
- Peer-reviewed methodology
- Collaboration with academic institutions
- Dataset benchmarking and leaderboard

---

## 5. Goals

| Goal | Description | Target |
|------|-------------|--------|
| G1 | Statistical engine produces defensible insights on real data within 30 days of deployment | Foundation |
| G2 | Zero hallucination — LLM communication layer never states a number not present in engine output | Foundation |
| G3 | First enterprise pilot signed within 6 months of MVP | Growth |
| G4 | Open-source core reaches 10,000 GitHub stars within 12 months | Ecosystem |
| G5 | Platform processes 1B+ causal queries annually within 24 months | Scale |

---

## 6. Non-Goals (v1)

- **Not a general-purpose BI tool** — no drag-and-drop chart builders
- **Not a predictive ML platform** — we explain causes, not forecast futures
- **Not a data warehouse** — we integrate with existing warehouses (Snowflake, BigQuery, Databricks)
- **Not a no-code automation tool** — Parable answers questions, it doesn't trigger workflows
- **Not social or multi-user in v1** — single-player causal analysis first

---

## 7. Target Users

### 7.1 Primary: The Decision Scientist
- Data-literate but not necessarily a statistician
- Works in product, marketing, ops, or clinical research
- Frustrated by correlation-based dashboards
- Needs defensible answers for stakeholders

### 7.2 Secondary: The Self-Quantifier
- Already tracks personal data
- Values honesty over hype
- Willing to do daily micro-interactions for insights

### 7.3 Tertiary: The Researcher / Academic
- Working on causal inference methodology
- Wants reproducible, benchmarked tools
- Values open-source and peer review

---

## 8. Core MVP Feature Set

### 8.1 Universal Data Connector
- CSV upload (drag-and-drop)
- Database connections (PostgreSQL, Snowflake, BigQuery)
- API integrations (Google Calendar, health APIs)
- Time-series normalization to common schema

### 8.2 Causal Discovery Engine
- Automated causal graph discovery from observational data
- Lag-correlation and Granger causality testing
- Confound detection and adjustment
- Confidence tiering: Emerging → Established → Strong → Proven
- Minimum sample-size gates

### 8.3 Insight Communication Layer
- LLM-powered natural language generation
- Strict grounding: never fabricate numbers
- Confidence-matched tone (tentative for Emerging, direct for Strong)
- Expandable evidence: every insight shows underlying data

### 8.4 Daily Surface (Personal)
- Single-screen daily check-in (mood, energy, free text)
- 1-2 surfaced insights maximum
- Deliberately sparse — "check once, leave"

### 8.5 Enterprise Dashboard (B2B)
- Causal graph visualization
- Insight feed with filtering and search
- Export to PowerPoint / PDF for stakeholder communication
- Audit trail for regulatory compliance

---

## 9. Competitive Landscape

| Competitor | Category | Weakness vs. Parable |
|------------|----------|---------------------|
| **Tableau / Power BI** | BI / Dashboards | No causal inference |
| **Databricks / Snowflake** | Data Platforms | No causal analysis layer |
| **Causal (causal.app)** | Causal Modeling | Spreadsheet-based, limited discovery |
| **DoWhy / CausalML** | Open-Source Libraries | Requires coding expertise |
| **Gyroscope / Exist.io** | Personal Analytics | Shallow correlations, discontinued |
| **ChatGPT / Claude** | General AI | Hallucinates causal claims |

**Parable's Moat:** The only platform that combines *automated causal discovery* + *rigorous validation* + *trustworthy natural language communication* in a zero-code interface.

---

## 10. Business Model

| Tier | Price | Includes |
|------|-------|----------|
| **Personal Free** | $0 | 2 data sources, daily insights, 30-day history |
| **Personal Pro** | $9.99/mo | Unlimited sources, full history, advanced integrations |
| **Team** | $99/mo per seat | Enterprise connectors, collaboration, audit trail |
| **Enterprise** | Custom | On-premise deployment, custom models, SLA, dedicated support |
| **API** | Usage-based | $0.01 per causal query, volume discounts |

---

## 11. Success Metrics

| Metric | Q1 Target | Q4 Target |
|--------|-----------|-----------|
| Personal MAU | 1,000 | 50,000 |
| Enterprise Pilots | 2 | 20 |
| API Queries / Month | — | 1M |
| GitHub Stars (Open Core) | 500 | 5,000 |
| Insight Grounding Accuracy | 100% | 100% |
| Avg. Time to First Insight | <14 days | <7 days |

---

## 12. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| False-positive insights | High | Critical | Conservative thresholds, explicit confidence tiers, "say nothing" default |
| Privacy breaches | Medium | Critical | E2E encryption, local-first option, raw data deletion after parsing |
| LLM hallucination | Medium | High | Strict grounding, engine-output-only input, manual spot-checking |
| Cold-start problem | High | Medium | Compelling onboarding narrative, synthetic insight demos |
| Enterprise sales cycle | Medium | Medium | Land with free tier, expand with proven ROI |

---

## 13. GTM Strategy

1. **Month 1-3:** Build open-source core, build community on Hacker News / Reddit / X
2. **Month 4-6:** Launch Parable Personal, acquire self-quantifiers via content marketing
3. **Month 6-9:** Launch Parable Enterprise pilots with 2-3 design partners
4. **Month 9-12:** Scale enterprise sales, launch API platform
5. **Year 2:** Series A, expand team, international expansion

---

*Document Owner: Product & Engineering  
Last Updated: 2026-07-21  
Next Review: 2026-08-21*
