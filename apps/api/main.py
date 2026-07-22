"""Parable API — FastAPI backend service.

Provides RESTful endpoints for:
- Data ingestion and normalization
- Causal discovery and inference
- Insight retrieval and communication
- User management and authentication
"""

from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any
from uuid import UUID

import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from parable.core.engine import CausalEngine
from parable.core.models import Finding, CausalGraph, ConfidenceTier


# ─── Pydantic Schemas ───────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "0.1.0"
    timestamp: str


class IngestRequest(BaseModel):
    user_id: str
    data: list[dict[str, Any]]


class IngestResponse(BaseModel):
    success: bool
    records_ingested: int
    signals_detected: list[str]


class DiscoverRequest(BaseModel):
    user_id: str
    algorithm: str = "pc"


class DiscoverResponse(BaseModel):
    graph: dict[str, Any]
    nodes: int
    edges: int


class TestCausalRequest(BaseModel):
    user_id: str
    treatment: str
    outcome: str
    method: str = "backdoor"


class FindingResponse(BaseModel):
    finding_id: str
    signal_a: str
    signal_b: str
    relationship: str
    direction: str
    effect_size: float
    confidence_tier: str
    sample_size: int
    p_value: float | None
    natural_language: str


class InsightListResponse(BaseModel):
    insights: list[FindingResponse]
    total: int


# ─── Application ────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    app.state.engine = CausalEngine()
    yield
    # Shutdown
    pass


app = FastAPI(
    title="Parable API",
    description="Causal Intelligence Operating System",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Health ─────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(timestamp=datetime.utcnow().isoformat())


@app.get("/ready", tags=["System"])
async def readiness_check() -> dict[str, str]:
    """Readiness probe for Kubernetes."""
    return {"status": "ready"}


# ─── Data Ingestion ─────────────────────────────────────────────

@app.post("/api/v1/ingest/csv", response_model=IngestResponse, tags=["Ingestion"])
async def ingest_csv(
    user_id: str,
    file: UploadFile = File(...),
) -> IngestResponse:
    """Upload and ingest a CSV file.

    The CSV will be parsed, normalized, and stored for causal analysis.
    """
    try:
        content = await file.read()
        df = pd.read_csv(pd.io.common.BytesIO(content))

        # Store in engine state (simplified — production uses database)
        engine = app.state.engine
        engine.load(df, user_id=user_id)

        return IngestResponse(
            success=True,
            records_ingested=len(df),
            signals_detected=list(df.columns),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse CSV: {str(e)}",
        )


@app.post("/api/v1/ingest/json", response_model=IngestResponse, tags=["Ingestion"])
async def ingest_json(
    request: IngestRequest,
) -> IngestResponse:
    """Ingest data from JSON payload."""
    try:
        df = pd.DataFrame(request.data)
        engine = app.state.engine
        engine.load(df, user_id=request.user_id)

        return IngestResponse(
            success=True,
            records_ingested=len(df),
            signals_detected=list(df.columns),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse data: {str(e)}",
        )


# ─── Causal Discovery ───────────────────────────────────────────

@app.post("/api/v1/discover", response_model=DiscoverResponse, tags=["Discovery"])
async def discover_causal_graph(
    request: DiscoverRequest,
) -> DiscoverResponse:
    """Discover causal graph from user's data.

    Returns a directed acyclic graph representing discovered
    causal relationships between variables.
    """
    try:
        engine = app.state.engine
        graph = engine.discover(algorithm=request.algorithm)

        return DiscoverResponse(
            graph=graph.model_dump(),
            nodes=len(graph.nodes),
            edges=len(graph.edges),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Discovery failed: {str(e)}",
        )


# ─── Causal Inference ───────────────────────────────────────────

@app.post("/api/v1/test-causal", response_model=FindingResponse, tags=["Inference"])
async def test_causal_relationship(
    request: TestCausalRequest,
) -> FindingResponse:
    """Test a specific causal hypothesis.

    Given a treatment and outcome variable, estimates the causal
    effect using the specified inference method.
    """
    try:
        engine = app.state.engine
        finding = engine.test_causal(
            treatment=request.treatment,
            outcome=request.outcome,
            method=request.method,
        )

        return FindingResponse(
            finding_id=str(finding.finding_id),
            signal_a=finding.signal_a,
            signal_b=finding.signal_b,
            relationship=finding.relationship,
            direction=finding.direction,
            effect_size=finding.effect_size,
            confidence_tier=finding.confidence_tier.value,
            sample_size=finding.sample_size,
            p_value=finding.p_value,
            natural_language=finding.to_natural_language(),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference failed: {str(e)}",
        )


# ─── Insights ───────────────────────────────────────────────────

@app.get("/api/v1/insights", response_model=InsightListResponse, tags=["Insights"])
async def list_insights(
    user_id: str,
    min_confidence: str = "Emerging",
    limit: int = 10,
) -> InsightListResponse:
    """List insights for a user.

    Returns the most significant causal findings, sorted by
    confidence tier and effect size.
    """
    # Simplified — production queries database
    # This would retrieve findings from the findings table
    return InsightListResponse(insights=[], total=0)


@app.get("/api/v1/insights/{insight_id}", response_model=FindingResponse, tags=["Insights"])
async def get_insight(
    insight_id: UUID,
) -> FindingResponse:
    """Get a specific insight by ID."""
    # Simplified — production queries database
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Database integration required",
    )


# ─── Error Handlers ─────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "Internal server error", "detail": str(exc)},
    )


# ─── Entry Point ────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
