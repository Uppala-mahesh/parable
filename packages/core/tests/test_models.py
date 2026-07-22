"""Tests for parable.core.models."""

import pytest
from uuid import UUID

from parable.core.models import (
    ConfidenceTier,
    Finding,
    Signal,
    NormalizedEvent,
    CausalGraph,
)


class TestConfidenceTier:
    def test_confidence_tier_values(self):
        assert ConfidenceTier.EMERGING.value == "Emerging"
        assert ConfidenceTier.ESTABLISHED.value == "Established"
        assert ConfidenceTier.STRONG.value == "Strong"
        assert ConfidenceTier.PROVEN.value == "Proven"


class TestSignal:
    def test_signal_creation(self):
        signal = Signal(name="mood", type="ordinal", source="check_in", unit="1-5")
        assert signal.name == "mood"
        assert signal.type == "ordinal"
        assert isinstance(signal.id, UUID)

    def test_signal_immutable(self):
        signal = Signal(name="test", type="continuous", source="api")
        with pytest.raises(Exception):
            signal.name = "changed"


class TestNormalizedEvent:
    def test_event_creation(self):
        event = NormalizedEvent(
            user_id="user-123",
            signal_id="signal-456",
            timestamp="2026-07-21T10:00:00Z",
            value=4.5,
            value_type="continuous",
        )
        assert event.value == 4.5
        assert event.confidence == 1.0

    def test_event_with_metadata(self):
        event = NormalizedEvent(
            user_id="user-123",
            signal_id="signal-456",
            timestamp="2026-07-21T10:00:00Z",
            value=1,
            value_type="boolean",
            metadata={"source_app": "Apple Health"},
        )
        assert event.metadata["source_app"] == "Apple Health"


class TestCausalGraph:
    def test_graph_creation(self):
        graph = CausalGraph(
            user_id="user-123",
            nodes=["A", "B", "C"],
            edges=[("A", "B"), (B, C)],
            algorithm="pc",
            generated_at="2026-07-21T10:00:00Z",
        )
        assert len(graph.nodes) == 3
        assert len(graph.edges) == 2


class TestFinding:
    def test_finding_creation(self):
        finding = Finding(
            user_id="user-123",
            signal_a="exercise",
            signal_b="mood",
            relationship="causal",
            direction="positive",
            effect_size=0.42,
            confidence_tier=ConfidenceTier.ESTABLISHED,
            sample_size=47,
            p_value=0.003,
            algorithm="backdoor",
            generated_at="2026-07-21T10:00:00Z",
        )
        assert finding.signal_a == "exercise"
        assert finding.effect_size == 0.42

    def test_finding_to_natural_language_established(self):
        finding = Finding(
            user_id="user-123",
            signal_a="exercise",
            signal_b="mood",
            relationship="causal",
            direction="positive",
            effect_size=0.42,
            confidence_tier=ConfidenceTier.ESTABLISHED,
            sample_size=47,
            algorithm="backdoor",
            generated_at="2026-07-21T10:00:00Z",
        )
        text = finding.to_natural_language()
        assert "We've found that" in text
        assert "exercise" in text
        assert "mood" in text
        assert "42%" in text

    def test_finding_to_natural_language_negative(self):
        finding = Finding(
            user_id="user-123",
            signal_a="stress",
            signal_b="sleep_quality",
            relationship="causal",
            direction="negative",
            effect_size=0.35,
            confidence_tier=ConfidenceTier.EMERGING,
            sample_size=20,
            algorithm="backdoor",
            generated_at="2026-07-21T10:00:00Z",
        )
        text = finding.to_natural_language()
        assert "decreases" in text
        assert "We're noticing a pattern" in text
