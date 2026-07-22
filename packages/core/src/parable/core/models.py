"""Core causal inference models."""

from enum import Enum
from typing import Any, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class ConfidenceTier(str, Enum):
    """Confidence tiers for causal findings.

    Emerging: Correlation observed, marginal sample size
    Established: Holds across windows, basic confounds ruled out
    Strong: Established + large consistent effect
    Proven: Strong + experimental validation
    """

    EMERGING = "Emerging"
    ESTABLISHED = "Established"
    STRONG = "Strong"
    PROVEN = "Proven"


class Signal(BaseModel):
    """A data signal that can be analyzed for causal relationships."""

    id: UUID = Field(default_factory=uuid4)
    name: str
    type: str = Field(
        default="continuous",
        description="continuous, categorical, ordinal, boolean",
    )
    source: str
    unit: Optional[str] = None
    description: Optional[str] = None

    class Config:
        frozen = True


class NormalizedEvent(BaseModel):
    """A normalized time-series event.

    All data sources normalize to this common shape, enabling
    the causal engine to treat signals uniformly regardless of origin.
    """

    event_id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    signal_id: UUID
    timestamp: str  # ISO 8601
    value: float
    value_type: str
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    metadata: Optional[dict[str, Any]] = None

    class Config:
        frozen = True


class CausalGraph(BaseModel):
    """A discovered causal graph.

    Represents variables as nodes and causal relationships as directed edges.
    """

    id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    nodes: list[str] = Field(default_factory=list)
    edges: list[tuple[str, str]] = Field(default_factory=list)
    edge_confidences: dict[tuple[str, str], float] = Field(default_factory=dict)
    algorithm: str
    generated_at: str  # ISO 8601

    class Config:
        frozen = True


class Finding(BaseModel):
    """A validated causal finding.

    This is the core output of the causal engine — a structured,
    testable, auditable statement about a cause-and-effect relationship.
    """

    finding_id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    signal_a: str
    signal_b: str
    relationship: str = Field(
        default="causal",
        description="causal, associative, or spurious",
    )
    direction: str = Field(
        default="positive",
        description="positive, negative, or nonlinear",
    )
    effect_size: float = Field(description="Standardized effect size (Cohen's d or similar)")
    confidence_tier: ConfidenceTier
    sample_size: int = Field(ge=0)
    p_value: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    lag_days: int = Field(default=0, ge=0)
    confounds_checked: list[str] = Field(default_factory=list)
    confounds_ruled_out: list[str] = Field(default_factory=list)
    supporting_data_points: list[dict[str, Any]] = Field(default_factory=list)
    algorithm: str
    generated_at: str  # ISO 8601

    def to_natural_language(self) -> str:
        """Generate a human-readable summary.

        Note: In production, this is handled by the LLM communication layer
        with strict grounding rules. This method provides a basic fallback.
        """
        prefix = {
            ConfidenceTier.EMERGING: "We're noticing a pattern: ",
            ConfidenceTier.ESTABLISHED: "We've found that ",
            ConfidenceTier.STRONG: "It's clear that ",
            ConfidenceTier.PROVEN: "Evidence confirms that ",
        }[self.confidence_tier]

        direction_word = "increases" if self.direction == "positive" else "decreases"
        effect_pct = f"{abs(self.effect_size) * 100:.0f}%"

        return (
            f"{prefix}{self.signal_a} {direction_word} {self.signal_b} "
            f"by roughly {effect_pct}. "
            f"Confidence: {self.confidence_tier.value}. "
            f"Based on {self.sample_size} data points."
        )

    class Config:
        frozen = True
