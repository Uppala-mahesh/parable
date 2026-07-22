# Parable — Strategic Roadmap

> **From MVP to Multi-Billion Platform**

**Version:** 1.0  
**Status:** Active Planning  
**Horizon:** 24 Months

---

## Phase 0: Foundation (Months 1-2)

**Theme:** Build the engine. Prove the math. Ship to yourself.

| Week | Deliverable | Success Criteria |
|------|-------------|-----------------|
| 1-2 | Monorepo setup, CI/CD, dev environment | `git push` triggers full test suite |
| 2-3 | PostgreSQL + TimescaleDB schema | Schema migrations automated |
| 3-4 | Data ingestion API (CSV + check-in) | Can upload CSV, see normalized signals |
| 4-5 | Causal engine v1 (correlation + lag detection) | Produces correct results on synthetic data |
| 5-6 | Confidence tiering + sample-size gates | No insight surfaces below threshold |
| 6-7 | LLM communication layer | Zero hallucination across 100 test cases |
| 7-8 | Web app MVP (daily check-in + 1-2 insights) | You are user #1, collecting real data |

**Key Metric:** Engine produces first non-obvious, correct insight on synthetic data.

**Personal Data Collection:** Start day one. You need 2-3 weeks of your own data before the engine has anything real to analyze.

---

## Phase 1: Open Source Core (Months 3-4)

**Theme:** Open the engine. Build community. Establish credibility.

| Week | Deliverable | Success Criteria |
|------|-------------|-----------------|
| 9-10 | Extract causal engine to standalone Python package | `pip install parable-core` works |
| 10-11 | Open-source on GitHub with full documentation | README, examples, API docs |
| 11-12 | Benchmark against public causal inference datasets | Results published, competitive with SOTA |
| 12-13 | Community engagement (blog posts, Hacker News, Reddit) | 1,000+ GitHub stars |

**Key Metric:** 1,000 GitHub stars and 3 external contributors.

**Strategic Value:** Open source builds trust, attracts talent, and establishes Parable as the thought leader in causal inference.

---

## Phase 2: Personal Product (Months 4-6)

**Theme:** Ship the consumer app. Find product-market fit with self-quantifiers.

| Week | Deliverable | Success Criteria |
|------|-------------|-----------------|
| 13-14 | Google Calendar integration | Meeting density as cross-domain signal |
| 14-15 | Screen time CSV import | Parsed and categorized |
| 15-16 | Spending CSV import | Bank/UPI statement parsing |
| 16-17 | Private beta (10-20 users) | 3 users report genuinely surprising insight |
| 17-18 | Public launch (Product Hunt, Hacker News) | 1,000 signups in first week |
| 18-20 | Freemium model + Stripe integration | First paying customer |

**Key Metrics:**
- 1,000 MAU by end of Month 6
- Day-14 retention ≥ 35%
- ≥50% of users receive ≥1 "Established" insight by day 21
- First $1K MRR

---

## Phase 3: Enterprise Platform (Months 7-12)

**Theme:** Monetize B2B. Land design partners. Build enterprise features.

| Month | Deliverable | Success Criteria |
|-------|-------------|-----------------|
| 7 | Enterprise dashboard (causal graph viz, export, audit) | Demo-ready |
| 8 | Snowflake / BigQuery / Databricks connectors | 3 design partners signed |
| 9 | Team collaboration + RBAC | First enterprise pilot live |
| 10 | API platform launch (REST + GraphQL, SDKs) | 10 API consumers |
| 11 | SOC 2 Type II certification | Enterprise sales unblocked |
| 12 | Case studies + ROI documentation | 5 enterprise customers, $50K ARR |

**Key Metrics:**
- 5 enterprise customers
- $50K ARR
- 1M API queries/month
- 5,000 GitHub stars

---

## Phase 4: Scale & Platform (Months 13-18)

**Theme:** Scale infrastructure. Expand use cases. Internationalize.

| Month | Deliverable | Success Criteria |
|-------|-------------|-----------------|
| 13-14 | Multi-region deployment (US, EU) | <100ms p99 latency globally |
| 15 | Mobile app (iOS + Android) | Native health integrations |
| 16 | Advanced causal methods (synthetic control, diff-in-diff) | Enterprise upsell |
| 17 | Marketplace: pre-built causal models for verticals | 10 marketplace models |
| 18 | Series A fundraising | $10M+ raised |

**Key Metrics:**
- 50,000 MAU (Personal)
- 20 enterprise customers
- $500K ARR
- 10,000 GitHub stars

---

## Phase 5: Ecosystem & Dominance (Months 19-24)

**Theme:** Own the category. Become the default for causal intelligence.

| Month | Deliverable | Success Criteria |
|-------|-------------|-----------------|
| 19-20 | Parable Research: academic partnerships, dataset leaderboard | 5 university partnerships |
| 21 | On-premise deployment option | Fortune 500 customer |
| 22 | Real-time causal streaming | Sub-second insight generation |
| 23 | AI agent integration (causal reasoning for LLM agents) | Partnership with major AI platform |
| 24 | Series B or strategic acquisition discussions | $5M+ ARR, 50+ enterprise customers |

**Key Metrics:**
- 200,000 MAU
- 50+ enterprise customers
- $5M+ ARR
- 25,000 GitHub stars
- Category leader in "causal intelligence"

---

## Investment Requirements

| Phase | Time | Capital | Team Size |
|-------|------|---------|-----------|
| Foundation | 2 months | $50K (founder savings) | 1-2 |
| Open Source | 2 months | $50K | 2-3 |
| Personal | 2 months | $100K (angel/seed) | 3-4 |
| Enterprise | 6 months | $500K (seed) | 6-10 |
| Scale | 6 months | $3M (Series A) | 15-25 |
| Ecosystem | 6 months | $10M+ (Series B) | 40-60 |

**Total to Series B:** ~$14M over 24 months.

---

## Risk-Adjusted Timeline

| Scenario | Outcome |
|----------|---------|
| **Bull Case** (20%) | Series B at $5M ARR, $100M valuation by Month 24 |
| **Base Case** (60%) | Series A at $500K ARR, $10M valuation by Month 18 |
| **Bear Case** (20%) | Sustainable indie business at $100K ARR by Month 24 |

---

## Milestone Checkpoints

| Checkpoint | Date | Criteria |
|-----------|------|----------|
| **Engine Validated** | Month 2 | Causal engine produces correct insight on synthetic data |
| **Community Proof** | Month 4 | 1,000 GitHub stars, 3+ external contributors |
| **Product-Market Fit** | Month 6 | 1,000 MAU, 35% D14 retention |
| **Enterprise Traction** | Month 12 | 5 enterprise customers, $50K ARR |
| **Scale Proof** | Month 18 | 50K MAU, $500K ARR, Series A closed |
| **Category Leadership** | Month 24 | $5M ARR, 50+ enterprise, 25K GitHub stars |

---

*Document Owner: Executive Team  
Last Updated: 2026-07-21  
Next Review: Monthly*
