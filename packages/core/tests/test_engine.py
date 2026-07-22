"""Tests for parable.core.engine."""

import numpy as np
import pandas as pd
import pytest

from parable.core.engine import CausalEngine
from parable.core.models import ConfidenceTier


class TestCausalEngine:
    @pytest.fixture
    def sample_data(self):
        """Generate synthetic data with known causal relationships."""
        np.random.seed(42)
        n = 100
        # A -> B -> C, with A being independent noise
        a = np.random.normal(0, 1, n)
        b = 0.5 * a + np.random.normal(0, 0.5, n)
        c = 0.3 * b + np.random.normal(0, 0.7, n)
        return pd.DataFrame({"A": a, "B": b, "C": c})

    @pytest.fixture
    def engine(self):
        return CausalEngine()

    def test_load_dataframe(self, engine, sample_data):
        result = engine.load(sample_data, user_id="test-user")
        assert result is not None
        assert len(result) == 100

    def test_normalize(self, engine, sample_data):
        engine.load(sample_data)
        normalized = engine.normalize()
        # After standardization, mean should be ~0, std ~1
        for col in normalized.columns:
            assert abs(normalized[col].mean()) < 0.1
            assert abs(normalized[col].std() - 1.0) < 0.1

    def test_discover(self, engine, sample_data):
        engine.load(sample_data, user_id="test-user")
        graph = engine.discover()
        assert graph is not None
        assert "A" in graph.nodes
        assert "B" in graph.nodes
        assert "C" in graph.nodes

    def test_test_causal(self, engine, sample_data):
        engine.load(sample_data, user_id="test-user")
        finding = engine.test_causal("A", "B")
        assert finding.signal_a == "A"
        assert finding.signal_b == "B"
        assert finding.sample_size == 100

    def test_analyze_all_pairs(self, engine, sample_data):
        engine.load(sample_data, user_id="test-user")
        findings = engine.analyze_all_pairs(min_effect_size=0.1)
        assert len(findings) > 0
        # Should find A->B or B->C relationships
        relationships = [(f.signal_a, f.signal_b) for f in findings]
        assert ("A", "B") in relationships or ("B", "C") in relationships

    def test_insufficient_data(self, engine):
        small_data = pd.DataFrame({
            "X": [1, 2, 3],
            "Y": [1, 2, 3],
        })
        engine.load(small_data)
        finding = engine.test_causal("X", "Y")
        assert finding.confidence_tier == ConfidenceTier.EMERGING
        assert finding.sample_size < 15
