"""Parable Core — Causal Inference Engine.

The world's first open-source causal intelligence engine.
Designed for automated causal discovery, rigorous validation,
and trustworthy communication of cause-and-effect relationships.
"""

__version__ = "0.1.0"
__author__ = "Parable Engineering Team"

from parable.core.engine import CausalEngine
from parable.core.models import (
    Finding,
    ConfidenceTier,
    CausalGraph,
    Signal,
    NormalizedEvent,
)
from parable.core.discovery import (
    PCDiscovery,
    GESDiscovery,
    NOTEARSDiscovery,
)
from parable.core.inference import (
    BackdoorInference,
    IVInference,
    SyntheticControl,
)

__all__ = [
    "CausalEngine",
    "Finding",
    "ConfidenceTier",
    "CausalGraph",
    "Signal",
    "NormalizedEvent",
    "PCDiscovery",
    "GESDiscovery",
    "NOTEARSDiscovery",
    "BackdoorInference",
    "IVInference",
    "SyntheticControl",
]
