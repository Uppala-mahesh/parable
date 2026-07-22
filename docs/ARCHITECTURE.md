# Parable — Technical Architecture

> **Causal Intelligence Operating System**
>
> *Designed for truth at scale.*

**Version:** 1.0 — Foundation  
**Status:** Architecture Complete / Implementation Ready  
**Classification:** Confidential — Internal Use Only

---

## 1. Design Philosophy

Parable's architecture is built on three principles:

1. **Separation of Concerns:** The statistical engine and LLM layer are deliberately decoupled. You never debug "is the insight wrong because of bad stats or bad prompting" as one tangled problem.
2. **Trust by Design:** Every layer is inspectable, testable, and auditable. Trust is not a feature — it's the foundation.
3. **Scale-Ready from Day One:** The MVP architecture must support the eventual scale of billions of queries without a rewrite.

---

## 2. System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Web App    │  │  Mobile App │  │  Enterprise │  │  API Consumers      │ │
│  │  (Next.js)  │  │  (React     │  │  Dashboard  │  │  (SDKs: Py, TS, Go)│ │
│  │             │  │   Native)   │  │  (React)    │  │                     │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼────────────────┼────────────────────┼────────────┘
          │                │                │                    │
          ▼                ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY (Kong / Envoy)                          │
│         Auth (JWT + OAuth2) │ Rate Limiting │ Request Routing │ Logging      │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SERVICE LAYER (Kubernetes)                            │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │  Ingestion      │  │  Query          │  │  Communication              │  │
│  │  Service        │  │  Service        │  │  Service                    │  │
│  │  (FastAPI)      │  │  (FastAPI)      │  │  (FastAPI + LLM Gateway)    │  │
│  │                 │  │                 │  │                             │  │
│  │  • Data upload  │  │  • Causal graph │  │  • NLG from findings        │  │
│  │  • Connectors   │  │  • Hypothesis   │  │  • Tone matching            │  │
│  │  • Normalization│  │  • Validation   │  │  • Evidence expansion       │  │
│  └────────┬────────┘  └────────┬────────┘  └─────────────┬───────────────┘  │
│           │                    │                         │                   │
│           ▼                    ▼                         ▼                   │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │              CAUSAL ENGINE (Python — The Core IP)                    │    │
│  │                                                                      │    │
│  │  • Causal Discovery (PC, GES, NOTEARS)                              │    │
│  │  • Causal Inference (DoWhy + custom)                                │    │
│  │  • Time-Series Causality (Granger, CCM, VAR)                        │    │
│  │  • Confound Detection & Adjustment                                  │    │
│  │  • Confidence Scoring (Emerging → Established → Strong → Proven)    │    │
│  │                                                                      │    │
│  │  Pure code. No LLM. Fully unit-testable.                             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                            │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │  PostgreSQL     │  │  TimescaleDB    │  │  Redis                      │  │
│  │  (Metadata,     │  │  (Time-Series   │  │  (Cache, Session,           │  │
│  │   Users, Graph) │  │   Signals)      │  │   Rate Limiting)            │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │  S3 / GCS       │  │  Vector DB      │  │  ClickHouse                 │  │
│  │  (Raw CSVs,     │  │  (Pinecone,     │  │  (Analytics,                │  │
│  │   Snapshots)    │  │   Weaviate)     │  │   Event Streaming)          │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     OBSERVABILITY & SECURITY                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │  Datadog /      │  │  HashiCorp      │  │  Sentry                     │  │
│  │  Grafana Stack  │  │  Vault          │  │  (Error Tracking)           │  │
│  │  (Metrics,      │  │  (Secrets)      │  │                             │  │
│  │   Logs, Traces) │  │                 │  │                             │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Layer Specifications

### 3.1 Data Ingestion Layer

**Responsibility:** Accept, validate, and normalize data from any source into the canonical time-series format.

**Canonical Schema:**
```json
{
  "event_id": "uuid",
  "user_id": "uuid",
  "signal_name": "string",
  "timestamp": "iso8601",
  "value": "number | string | boolean",
  "value_type": "continuous | categorical | ordinal | boolean",
  "source": "check_in | calendar | screen_time | spending | api | csv_upload",
  "confidence": "float 0.0-1.0",
  "metadata": "jsonb",
  "created_at": "iso8601"
}
```

**Sources:**
- CSV upload (drag-and-drop parser)
- Database connectors (PostgreSQL, Snowflake, BigQuery, Databricks)
- API integrations (Google Calendar, Apple Health, Plaid)
- Manual check-in (mood/energy/free text)

**Privacy:**
- Raw uploads encrypted at rest (AES-256)
- Raw CSVs deleted after parsing into normalized signals
- Row-level encryption for sensitive signals (spending, health)
- Local-first option: statistical engine runs on-device; only structured findings touch the cloud

### 3.2 Causal Engine (Core IP)

**Responsibility:** Discover, test, and score causal relationships — pure Python, no LLM.

**Pipeline:**
```
Raw Signals → Normalization → Feature Engineering → Causal Discovery → 
Hypothesis Testing → Confound Adjustment → Confidence Scoring → Structured Finding
```

**Algorithms:**
| Stage | Algorithm | Library |
|-------|-----------|---------|
| Causal Discovery | PC, GES, NOTEARS | `gcastle`, `cdt`, custom |
| Time-Series Causality | Granger, Convergent Cross Mapping (CCM) | `statsmodels`, custom |
| Causal Inference | Backdoor criterion, IV, Propensity Score | `DoWhy`, custom |
| Effect Size | Cohen's d, Pearson's r, Kendall's τ | `scipy` |

**Confidence Tiers:**
| Tier | Criteria | Communication |
|------|----------|---------------|
| **Emerging** | Correlation observed, n < 30, no confound check | "We're noticing a pattern..." |
| **Established** | Correlation holds across ≥3 windows, basic confounds ruled out, n ≥ 30 | "We've found that..." |
| **Strong** | Established + large consistent effect size, n ≥ 100 | "It's clear that..." |
| **Proven** | Strong + experimental or quasi-experimental validation | "Evidence confirms that..." |

**Output Format:**
```json
{
  "finding_id": "uuid",
  "signal_a": "morning_exercise",
  "signal_b": "evening_food_delivery_spend",
  "relationship": "causal",
  "direction": "negative",
  "effect_size": 0.42,
  "confidence_tier": "Established",
  "sample_size": 47,
  "p_value": 0.003,
  "lag_days": 0,
  "confounds_checked": ["day_of_week", "weather"],
  "confounds_ruled_out": ["day_of_week"],
  "supporting_data_points": [...],
  "generated_at": "2026-07-21T10:00:00Z"
}
```

### 3.3 Insight Communication Layer

**Responsibility:** Translate structured findings into trustworthy natural language.

**Architecture:**
- Input: ONLY the structured finding JSON
- System prompt enforces strict grounding rules
- LLM never sees raw time series
- Temperature = 0 for consistency

**Grounding Rules:**
1. State only what's in the structured input (no embellishment, no invented numbers)
2. Match tone to confidence tier
3. Always offer "why am I seeing this" expansion
4. Include uncertainty bounds where available
5. Never present correlation as causation without the "causal" relationship flag

**Model Strategy:**
- Primary: Claude 3.5 Sonnet (best price/performance for structured output)
- Fallback: GPT-4o-mini (cost optimization for high-volume)
- Enterprise: Customer-brings-own-key (Azure OpenAI, AWS Bedrock)

### 3.4 Client Layer

**Web App (Next.js 14 + App Router):**
- SSR for SEO and fast initial load
- Real-time updates via Server-Sent Events
- Responsive design (mobile-first)
- Dark mode default

**Mobile App (React Native — Phase 2):**
- Native health integrations (HealthKit, Google Fit)
- Push notifications for daily check-in
- Offline-first: store check-ins locally, sync when connected

**Enterprise Dashboard:**
- Causal graph D3.js visualization
- Insight filtering, search, and export
- Team collaboration features
- Audit log for compliance

---

## 4. Data Architecture

### 4.1 PostgreSQL (Primary)

```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    encrypted_password TEXT NOT NULL,
    tier TEXT DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Signals (metadata registry)
CREATE TABLE signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- continuous, categorical, ordinal, boolean
    source TEXT NOT NULL,
    unit TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Causal Graphs
CREATE TABLE causal_graphs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    graph_data JSONB NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Findings
CREATE TABLE findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    signal_a_id UUID REFERENCES signals(id),
    signal_b_id UUID REFERENCES signals(id),
    relationship TEXT NOT NULL,
    direction TEXT NOT NULL,
    effect_size FLOAT,
    confidence_tier TEXT NOT NULL,
    sample_size INT,
    p_value FLOAT,
    lag_days INT,
    metadata JSONB,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 TimescaleDB (Time-Series)

```sql
-- Hypertable for time-series events
CREATE TABLE events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    signal_id UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    value NUMERIC,
    value_type TEXT NOT NULL,
    confidence FLOAT DEFAULT 1.0,
    metadata JSONB
);

SELECT create_hypertable('events', 'timestamp');
CREATE INDEX idx_events_user_signal_time ON events (user_id, signal_id, timestamp DESC);
```

### 4.3 Redis

- Session store (JWT blacklisting)
- Rate limiting counters
- Cache for frequently accessed insights
- Pub/sub for real-time updates

---

## 5. Security Architecture

| Layer | Control |
|-------|---------|
| Transport | TLS 1.3 everywhere |
| Authentication | OAuth2 + JWT (short-lived access tokens, refresh tokens) |
| Authorization | RBAC with fine-grained permissions |
| Data at Rest | AES-256 encryption for sensitive tables |
| Secrets | HashiCorp Vault |
| API Security | Rate limiting, input validation, CORS policies |
| Audit | All data access logged immutably |

**Privacy-First Design:**
- Local-first statistical engine option (v2)
- Raw data deleted after normalization
- Explicit per-source consent
- GDPR / CCPA compliant data deletion

---

## 6. Observability

**Three Pillars:**
1. **Metrics:** Prometheus + Grafana — request latency, throughput, error rates, engine performance
2. **Logs:** Structured JSON logging (ELK or Datadog) — searchable, correlatable
3. **Traces:** OpenTelemetry + Jaeger — distributed trace across all services

**SLIs:**
- API p99 latency < 500ms
- Causal engine p99 latency < 5s
- Uptime > 99.9%
- Zero hallucination incidents (monitored via manual spot-checks)

---

## 7. Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui |
| Mobile | React Native (Phase 2) |
| API | FastAPI (Python) |
| Causal Engine | Python, scipy, statsmodels, DoWhy, gcastle, custom |
| Database | PostgreSQL 16, TimescaleDB |
| Cache | Redis 7 |
| Search/Vector | Pinecone or Weaviate |
| Message Queue | Redis (initial), Kafka (scale) |
| Container | Docker |
| Orchestration | Kubernetes (EKS/GKE) |
| CI/CD | GitHub Actions |
| IaC | Terraform |
| Monitoring | Datadog or Grafana Stack |
| Secrets | HashiCorp Vault |

---

## 8. Scaling Strategy

### Phase 1: MVP (0-1K users)
- Single Kubernetes cluster
- Single PostgreSQL instance + TimescaleDB
- Redis for cache and queues
- No CDN needed

### Phase 2: Growth (1K-100K users)
- Multi-region deployment
- Read replicas for PostgreSQL
- CDN for static assets
- Horizontal pod autoscaling

### Phase 3: Scale (100K-10M users)
- Database sharding by user_id
- Kafka for event streaming
- Dedicated causal engine cluster
- Multi-cloud (AWS + GCP)

---

*Document Owner: Engineering  
Last Updated: 2026-07-21  
Next Review: 2026-08-21*
