# Correlate — Product Requirements Document

**Tagline:** Your personal causal-insight engine. Not another dashboard — a system that tells you what's actually causing what in your own life.

**Version:** 1.0 (Draft)
**Owner:** [Your name]
**Status:** Pre-build / MVP scoping

---

## 1. Problem Statement

People track more data about themselves than ever — sleep, steps, screen time, spending, mood, calendar, workouts — through Apple Health, bank apps, screen-time trackers, journaling apps. But almost every one of these tools stops at *description*: "you slept 6.2 hours" or "you spent ₹4,200 on food delivery this month."

None of them answer the question people actually care about: **why**. Why do I overspend on certain days? Why does my mood crash on Thursdays? Why can't I stick to a workout streak past two weeks?

Earlier attempts at this (Exist.io, Gyroscope) either shut down or stayed shallow — showing correlation charts without statistical rigor, and without a way to *communicate* the finding in language a normal person trusts. That's the gap: the data has been available for years, but the causal reasoning + trustworthy communication layer has not been built well.

## 2. Vision

Correlate connects a small number of personal data streams and, over time, surfaces specific, falsifiable, honestly-caveated statements about what's driving the user's behavior and wellbeing — instead of dashboards, instead of generic advice.

**Example outputs (illustrative, not literal templates):**
- "On days you exercise before 9am, your food-delivery spend that evening drops by roughly 40%. Pattern held for 6 of the last 7 weeks."
- "Your low-mood check-ins are preceded by a spike in work notifications 9 times out of 10 — not by short sleep, which is what you guessed."
- "Not enough data yet to say whether your Sunday spending is linked to your Friday mood. Check back in 3 weeks."

That last example matters as much as the first two: **the product's credibility depends on knowing when to say nothing.**

## 3. Goals

- G1: Deliver at least one statistically defensible, personally relevant insight within the user's first 14 days of use.
- G2: Never present a correlation as causation without appropriate confidence language and caveats.
- G3: Build trust through transparency — every insight is inspectable (show the underlying data points, not just the sentence).
- G4: Retention through compounding value — the product gets more accurate and more personal the longer it's used.

## 4. Non-Goals (v1)

- Not a coaching app. It does not tell users what to do — it tells them what's true.
- Not a general-purpose dashboard/BI tool. No customizable charts, no "explore your data" mode in v1.
- Not a social or sharing product. Entirely single-player in v1.
- Not trying to support 20 data sources at launch. Depth over breadth.

## 5. Target Users

**Primary persona — "The Self-Quantifier Skeptic":** Already uses 1-2 tracking apps (Apple Health, a budgeting app, maybe a journal), has felt the "so what?" letdown of dashboards, values honesty over hype, mid-20s to 40s, comfortable connecting accounts if privacy is handled transparently.

**Secondary persona — "The Curious Beginner":** Doesn't track anything yet but is drawn in by a specific promise ("find out why you're always broke by the 20th") and is willing to do a 10-second daily check-in to get there.

## 6. Core MVP Feature Set

### 6.1 Data Ingestion (minimum viable sources)
- Daily micro check-in (mood 1-5, energy 1-5, one free-text line) — **always available, zero integration needed, ships day one**
- Calendar (Google Calendar API — read-only, event density/type as a signal)
- Screen time (manual CSV/export import for MVP; native OS integration later)
- Spending (manual CSV upload from bank/UPI export for MVP; Plaid-equivalent integration later)

*Rationale: starting with manual import/CSV avoids costly bank-integration engineering before the causal engine itself is proven out. This is the single biggest MVP scope-cut.*

### 6.2 Causal/Statistical Engine
- Lag-correlation detection across paired signals (e.g., sleep(t-1) vs. mood(t))
- Minimum sample-size and confidence thresholds before any insight is surfaced
- Basic confound flagging (e.g., day-of-week effects checked before attributing causality elsewhere)
- Insight scoring: every candidate insight gets a confidence tier (Emerging / Established / Strong) — never a bare claim

### 6.3 Insight Communication Layer (LLM)
- Takes validated statistical findings (not raw data) and converts them to plain-language sentences
- Strict grounding: the LLM is never allowed to state a number or relationship that isn't in the structured input it's given
- Includes a "why am I seeing this" expand-out showing the actual data points behind each insight

### 6.4 Daily Surface
- One home screen: today's check-in prompt + at most 1-2 active insights (not a feed, not a dashboard — deliberately sparse)

## 7. Explicitly Deferred (Post-MVP)

- Native health/screen-time integrations (HealthKit, Google Fit, native screen time APIs)
- Bank aggregation (Plaid or regional equivalent)
- Team/aggregate B2B wellness product
- Multi-user household correlation ("do your partner's late nights predict your bad mornings?")
- Push notifications / proactive nudges

## 8. Success Metrics

| Metric | Target (90 days post-launch) |
|---|---|
| Day-14 retention | ≥ 35% |
| % of users who receive ≥1 "Established" confidence insight by day 21 | ≥ 50% |
| Insight accuracy (spot-checked manually against raw data) | 100% grounding accuracy (zero fabricated numbers) |
| Daily check-in completion rate | ≥ 60% among retained users |

## 9. Risks & Open Questions

- **Statistical risk:** small personal-scale datasets are noisy — false-positive correlations are the core product risk, not an edge case. Mitigation: conservative thresholds, explicit confidence tiers, willingness to say "not yet."
- **Privacy risk:** this is sensitive personal data by definition. See Architecture doc for handling approach.
- **Trust risk:** one bad, obviously-wrong insight can permanently break user trust. The "no insight is better than a false insight" principle should be a hard product rule, not a nice-to-have.
- **Cold-start problem:** the product is worthless until enough data accumulates. Needs a compelling "why stick around for 2 weeks with nothing yet" narrative in onboarding.

## 10. Competitive Landscape (brief)

- **Exist.io / Gyroscope-era tools:** correlation dashboards, no causal rigor, mostly discontinued or stagnant.
- **Apple Health / Google Fit:** pure data display, zero cross-domain reasoning.
- **YNAB / Copilot Money, Reflectly, etc.:** single-domain (finance-only or mood-only) — no cross-domain causal reasoning.
- **Differentiation:** Correlate's wedge is cross-domain causal reasoning + honest confidence communication, not more tracking.
