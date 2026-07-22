"""Main CausalEngine orchestrating discovery and inference."""

from typing import Any, Optional

import pandas as pd

from parable.core.discovery import BaseDiscovery, get_discovery_algorithm
from parable.core.inference import BaseInference, get_inference_method
from parable.core.models import CausalGraph, Finding


class CausalEngine:
    """The main entry point for causal analysis.

    Orchestrates data loading, causal discovery, and causal inference
    to produce validated, trustworthy findings.

    Example:
        >>> engine = CausalEngine()
        >>> data = engine.load("data.csv")
        >>> graph = engine.discover(data)
        >>> finding = engine.test_causal("exercise", "mood")
    """

    def __init__(
        self,
        discovery_algorithm: str = "pc",
        inference_method: str = "backdoor",
        discovery_params: Optional[dict[str, Any]] = None,
        inference_params: Optional[dict[str, Any]] = None,
    ) -> None:
        """Initialize the causal engine.

        Args:
            discovery_algorithm: Algorithm for causal discovery (pc, ges, notears)
            inference_method: Method for causal inference (backdoor, iv, synthetic_control)
            discovery_params: Additional parameters for discovery algorithm
            inference_params: Additional parameters for inference method
        """
        self.discovery: BaseDiscovery = get_discovery_algorithm(
            discovery_algorithm, **(discovery_params or {})
        )
        self.inference: BaseInference = get_inference_method(
            inference_method, **(inference_params or {})
        )
        self._data: Optional[pd.DataFrame] = None
        self._user_id: str = "default"
        self._last_graph: Optional[CausalGraph] = None

    def load(self, source: str | pd.DataFrame, user_id: str = "default") -> pd.DataFrame:
        """Load data into the engine.

        Args:
            source: File path or DataFrame
            user_id: Identifier for the dataset owner

        Returns:
            Loaded DataFrame
        """
        if isinstance(source, str):
            if source.endswith(".csv"):
                self._data = pd.read_csv(source)
            elif source.endswith(".parquet"):
                self._data = pd.read_parquet(source)
            else:
                raise ValueError(f"Unsupported file format: {source}")
        elif isinstance(source, pd.DataFrame):
            self._data = source.copy()
        else:
            raise TypeError(f"Source must be str or DataFrame, got {type(source)}")

        self._user_id = user_id
        return self._data

    def normalize(self, data: Optional[pd.DataFrame] = None) -> pd.DataFrame:
        """Normalize data for causal analysis.

        Handles missing values, standardizes numeric columns,
        and encodes categoricals.

        Args:
            data: DataFrame to normalize (uses loaded data if None)

        Returns:
            Normalized DataFrame
        """
        df = data if data is not None else self._data
        if df is None:
            raise ValueError("No data loaded. Call load() first.")

        df = df.copy()

        # Handle missing values
        numeric_cols = df.select_dtypes(include=["number"]).columns
        df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())

        # Standardize numeric columns
        for col in numeric_cols:
            mean = df[col].mean()
            std = df[col].std()
            if std > 0:
                df[col] = (df[col] - mean) / std

        # Encode categoricals
        categorical_cols = df.select_dtypes(include=["object", "category"]).columns
        for col in categorical_cols:
            df[col] = pd.Categorical(df[col]).codes

        return df

    def discover(
        self,
        data: Optional[pd.DataFrame] = None,
        algorithm: Optional[str] = None,
    ) -> CausalGraph:
        """Discover causal graph from data.

        Args:
            data: DataFrame to analyze (uses loaded data if None)
            algorithm: Override discovery algorithm

        Returns:
            Discovered causal graph
        """
        df = data if data is not None else self._data
        if df is None:
            raise ValueError("No data loaded. Call load() first.")

        normalized = self.normalize(df)

        if algorithm is not None:
            discovery = get_discovery_algorithm(algorithm)
        else:
            discovery = self.discovery

        self._last_graph = discovery.discover(normalized, self._user_id)
        return self._last_graph

    def test_causal(
        self,
        treatment: str,
        outcome: str,
        data: Optional[pd.DataFrame] = None,
        method: Optional[str] = None,
        **kwargs: Any,
    ) -> Finding:
        """Test a specific causal hypothesis.

        Args:
            treatment: Name of treatment variable
            outcome: Name of outcome variable
            data: DataFrame to analyze (uses loaded data if None)
            method: Override inference method
            **kwargs: Additional parameters for inference method

        Returns:
            Validated finding
        """
        df = data if data is not None else self._data
        if df is None:
            raise ValueError("No data loaded. Call load() first.")

        if method is not None:
            inference = get_inference_method(method, **kwargs)
        else:
            inference = self.inference

        return inference.estimate(df, treatment, outcome, self._user_id, **kwargs)

    def analyze_all_pairs(
        self,
        data: Optional[pd.DataFrame] = None,
        min_effect_size: float = 0.2,
        max_p_value: float = 0.05,
    ) -> list[Finding]:
        """Analyze all variable pairs for causal relationships.

        Args:
            data: DataFrame to analyze (uses loaded data if None)
            min_effect_size: Minimum effect size to report
            max_p_value: Maximum p-value to report

        Returns:
            List of significant findings
        """
        df = data if data is not None else self._data
        if df is None:
            raise ValueError("No data loaded. Call load() first.")

        variables = list(df.columns)
        findings: list[Finding] = []

        for i, var_a in enumerate(variables):
            for var_b in variables[i + 1 :]:
                try:
                    finding_ab = self.test_causal(var_a, var_b, df)
                    if (
                        finding_ab.relationship == "causal"
                        and finding_ab.effect_size >= min_effect_size
                        and (finding_ab.p_value or 1.0) <= max_p_value
                    ):
                        findings.append(finding_ab)

                    finding_ba = self.test_causal(var_b, var_a, df)
                    if (
                        finding_ba.relationship == "causal"
                        and finding_ba.effect_size >= min_effect_size
                        and (finding_ba.p_value or 1.0) <= max_p_value
                    ):
                        findings.append(finding_ba)

                except Exception:
                    # Skip pairs that can't be analyzed
                    continue

        # Sort by confidence tier and effect size
        tier_order = {"Proven": 4, "Strong": 3, "Established": 2, "Emerging": 1}
        findings.sort(
            key=lambda f: (tier_order.get(f.confidence_tier.value, 0), f.effect_size),
            reverse=True,
        )

        return findings
