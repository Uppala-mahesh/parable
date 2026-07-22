# Correlate — Technical Architecture

## 1. System Overview

Four layers, kept deliberately decoupled so the statistical engine can be tested independently of the LLM layer (critical — you don't want to debug "is the insight wrong because of bad stats or bad prompting" as one tangled problem):

```
[Data Ingestion Layer]
        ↓
[Normalization & Storage Layer]
        ↓
[Causal/Statistical Engine]   ←— pure code, no LLM, fully unit-testable
        ↓
[Insight Communication Layer] ←— LLM, grounded strictly in engine output
        ↓
[Client (daily surface)]
```

## 2. Data Ingestion Layer

**MVP sources:**
- Daily check-in: mood/energy (1-5 scale) + free text — direct user input, stored immediately
- Calendar: Google Calendar API (read-only scope), pulled daily via cron/webhook
- Screen time: CSV import (user exports from phone settings) — parsed on upload
- Spending: CSV import (bank/UPI statement export) — parsed on upload, categorized via simple rules + LLM fallback for ambiguous line items

**Design principle:** every source normalizes to a common time-series shape:
```
{ user_id, signal_name, timestamp, value, source, confidence }
```
This lets the statistical engine treat "mood," "money spent," "meeting density," and "screen time" uniformly as time series, regardless of origin.

## 3. Storage Layer

- Postgres for structured time-series signals (a single wide events table, indexed on user_id + timestamp + signal_name — avoid premature sharding by signal type)
- Row-level encryption for raw imported data (bank/screen-time exports are the most sensitive payloads)
- Retention policy: raw CSVs deleted after parsing into normalized signals; only normalized signals persist

## 4. Causal / Statistical Engine (the core IP)

This is pure Python, no LLM involved — deliberately, so it's testable and debuggable like normal software.

**Pipeline per signal pair (A, B):**
1. Align both series on a common time grid (daily buckets to start — avoid over-engineering time resolution in v1)
2. Test multiple lags (same-day, 1-day, 2-day) for correlation strength
3. Apply minimum-sample-size gate (no insight surfaces below ~20 paired data points)
4. Check obvious confounds: day-of-week, and any third signal that correlates with both A and B stronger than A-B correlate with each other
5. Assign confidence tier:
   - **Emerging**: correlation observed, sample size marginal, no confound check yet possible
   - **Established**: correlation holds across ≥3 non-overlapping windows, basic confounds ruled out
   - **Strong**: Established + effect size is large and consistent
6. Output structured finding object — never prose at this stage:
```json
{
  "signal_a": "morning_exercise",
  "signal_b": "evening_food_delivery_spend",
  "lag_days": 0,
  "direction": "negative",
  "effect_size": 0.4,
  "confidence_tier": "Established",
  "sample_size": 34,
  "supporting_data_points": [...]
}
```

**Library choice:** start with scipy/statsmodels for correlation + basic Granger causality tests. Do not reach for a full causal-inference library (e.g. DoWhy) until the simple approach's limitations are actually hit — this is a case where over-engineering early is a real risk to shipping.

## 5. Insight Communication Layer (LLM)

- Input: only the structured finding JSON from the statistical engine — the LLM never sees raw time series or is asked to "find patterns" itself
- System prompt constrains the model to:
  - State only what's in the structured input (no embellishment, no invented numbers)
  - Match tone to confidence tier (tentative language for "Emerging," direct for "Strong")
  - Always offer the "why am I seeing this" expansion using the supporting_data_points field
- This separation is the single most important architectural decision in the whole system: it prevents the classic LLM failure mode of confidently stating a plausible-sounding but false number.

## 6. Client / Daily Surface

- Single home screen: today's check-in + up to 2 surfaced insights
- Each insight is expandable to show underlying data (builds trust, and doubles as a debugging tool during your own development)
- No feed, no infinite scroll — deliberately sparse, "check once a day and leave" by design

## 7. Privacy & Security Notes

- All financial/screen-time raw exports encrypted at rest, deleted after parsing
- Explicit, source-by-source consent screens (don't bundle "connect everything" as one toggle)
- Local-first option worth considering for v2: run the statistical engine entirely on-device, only send the structured (already-anonymized, numbers-only) finding to the LLM API — removes raw personal data from ever touching a third-party API entirely
- This local-first angle is also a strong differentiator to mention in interviews: "I designed the architecture so the LLM never sees raw personal data, only statistically-validated abstractions."

## 8. Suggested Stack

- Backend: Python (FastAPI) — natural fit given the statistical engine is Python-native
- DB: Postgres
- Frontend: React (or React Native if mobile-first from day one)
- LLM: Claude API (Sonnet-tier is plenty for the communication layer — this isn't a task that needs the largest model)
- Scheduling: simple cron for daily calendar pulls, or a lightweight task queue (Celery/RQ) if it grows
