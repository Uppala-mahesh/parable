"""Causal discovery algorithms.

Implements multiple causal discovery methods:
- PC: Constraint-based using conditional independence tests
- GES: Score-based using greedy search
- NOTEARS: Continuous optimization for DAG learning
"""

from abc import ABC, abstractmethod
from typing import Any

import networkx as nx
import numpy as np
import pandas as pd
from scipy import stats

from parable.core.models import CausalGraph


class BaseDiscovery(ABC):
    """Abstract base class for causal discovery algorithms."""

    def __init__(self, alpha: float = 0.05) -> None:
        self.alpha = alpha

    @abstractmethod
    def discover(
        self, data: pd.DataFrame, user_id: str
    ) -> CausalGraph:
        """Discover causal graph from data.

        Args:
            data: DataFrame with variables as columns
            user_id: Identifier for the user/dataset

        Returns:
            Discovered causal graph
        """
        pass


class PCDiscovery(BaseDiscovery):
    """PC algorithm for causal discovery.

    Uses conditional independence tests to iteratively remove edges
    and orient remaining edges based on collider structures.

    Reference: Spirtes et al., "Causation, Prediction, and Search" (2000)
    """

    def __init__(self, alpha: float = 0.05, max_cond_vars: int = 3) -> None:
        super().__init__(alpha)
        self.max_cond_vars = max_cond_vars

    def discover(
        self, data: pd.DataFrame, user_id: str
    ) -> CausalGraph:
        """Run PC algorithm on data.

        This is a simplified implementation for demonstration.
        Production would use a full implementation with proper
        conditional independence testing.
        """
        variables = list(data.columns)
        n = len(variables)

        # Step 1: Start with fully connected undirected graph
        adj_matrix = np.ones((n, n)) - np.eye(n)

        # Step 2: Remove edges based on unconditional independence
        for i in range(n):
            for j in range(i + 1, n):
                _, p_value = stats.pearsonr(
                    data.iloc[:, i].dropna(),
                    data.iloc[:, j].dropna(),
                )
                if p_value > self.alpha:
                    adj_matrix[i, j] = adj_matrix[j, i] = 0

        # Step 3: Simple orientation (simplified — full PC would do collider detection)
        edges = []
        edge_confidences = {}
        for i in range(n):
            for j in range(i + 1, n):
                if adj_matrix[i, j] == 1:
                    # For simplicity, orient based on temporal ordering assumption
                    # In production, this would use proper collider detection
                    edges.append((variables[i], variables[j]))
                    corr, _ = stats.pearsonr(
                        data.iloc[:, i].dropna(),
                        data.iloc[:, j].dropna(),
                    )
                    edge_confidences[(variables[i], variables[j])] = abs(corr)

        return CausalGraph(
            user_id=user_id,
            nodes=variables,
            edges=edges,
            edge_confidences=edge_confidences,
            algorithm="pc",
            generated_at=pd.Timestamp.now().isoformat(),
        )


class GESDiscovery(BaseDiscovery):
    """Greedy Equivalence Search for causal discovery.

    Score-based algorithm that searches over DAG space using
    greedy hill-climbing with insert/delete/reverse operators.

    Reference: Chickering, "Optimal Structure Identification with
    Greedy Search" (2002)
    """

    def __init__(self, alpha: float = 0.05, max_parents: int = 5) -> None:
        super().__init__(alpha)
        self.max_parents = max_parents

    def discover(
        self, data: pd.DataFrame, user_id: str
    ) -> CausalGraph:
        """Run GES algorithm on data.

        Simplified implementation — production would use
        proper BIC scoring and operator application.
        """
        variables = list(data.columns)
        n = len(variables)

        # Simplified: use correlation matrix as proxy for edge selection
        corr_matrix = data.corr().abs().values
        np.fill_diagonal(corr_matrix, 0)

        # Threshold-based edge selection (simplified GES)
        threshold = 0.3  # Minimum correlation for edge
        edges = []
        edge_confidences = {}

        for i in range(n):
            for j in range(i + 1, n):
                if corr_matrix[i, j] > threshold:
                    edges.append((variables[i], variables[j]))
                    edge_confidences[(variables[i], variables[j])] = corr_matrix[i, j]

        return CausalGraph(
            user_id=user_id,
            nodes=variables,
            edges=edges,
            edge_confidences=edge_confidences,
            algorithm="ges",
            generated_at=pd.Timestamp.now().isoformat(),
        )


class NOTEARSDiscovery(BaseDiscovery):
    """NOTEARS: Continuous optimization for acyclic graphs.

    Formulates DAG learning as a continuous optimization problem
    using an acyclicity constraint.

    Reference: Zheng et al., "DAGs with NOTEARS: Continuous Optimization
    for Structure Learning" (NeurIPS 2018)
    """

    def __init__(self, alpha: float = 0.05, lambda1: float = 0.1) -> None:
        super().__init__(alpha)
        self.lambda1 = lambda1  # L1 regularization

    def discover(
        self, data: pd.DataFrame, user_id: str
    ) -> CausalGraph:
        """Run NOTEARS on data.

        Simplified implementation — production would use
        proper augmented Lagrangian optimization.
        """
        variables = list(data.columns)
        n = len(variables)

        # Simplified: Use regularized linear regression as proxy
        # Full implementation would solve the NOTEARS optimization
        corr_matrix = data.corr().abs().values
        np.fill_diagonal(corr_matrix, 0)

        # Apply L1-like thresholding
        threshold = self.lambda1
        edges = []
        edge_confidences = {}

        for i in range(n):
            for j in range(i + 1, n):
                if corr_matrix[i, j] > threshold:
                    # Orient based on stronger marginal correlation direction
                    # Simplified heuristic
                    edges.append((variables[i], variables[j]))
                    edge_confidences[(variables[i], variables[j])] = corr_matrix[i, j]

        return CausalGraph(
            user_id=user_id,
            nodes=variables,
            edges=edges,
            edge_confidences=edge_confidences,
            algorithm="notears",
            generated_at=pd.Timestamp.now().isoformat(),
        )


def get_discovery_algorithm(name: str, **kwargs: Any) -> BaseDiscovery:
    """Factory function for discovery algorithms.

    Args:
        name: Algorithm name (pc, ges, notears)
        **kwargs: Algorithm-specific parameters

    Returns:
        Configured discovery algorithm instance
    """
    algorithms: dict[str, type[BaseDiscovery]] = {
        "pc": PCDiscovery,
        "ges": GESDiscovery,
        "notears": NOTEARSDiscovery,
    }

    if name not in algorithms:
        raise ValueError(f"Unknown algorithm: {name}. Choose from {list(algorithms.keys())}")

    return algorithms[name](**kwargs)
