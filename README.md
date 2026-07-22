# Parable

> **The World's First Causal Intelligence Operating System**
>
> *Not dashboards. Not predictions. Truth.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Node 20+](https://img.shields.io/badge/node-20+-blue.svg)](https://nodejs.org/)
[![Tests](https://github.com/parable-ai/parable/actions/workflows/ci.yml/badge.svg)](https://github.com/parable-ai/parable/actions)

## What is Parable?

Parable is a causal intelligence platform that discovers, validates, and communicates cause-and-effect relationships across any dataset.

- **Traditional BI** tells you *what happened*
- **AI/ML** tells you *what might happen*
- **Parable** tells you **why it happens** — with statistical rigor, transparent confidence tiers, and zero hallucination

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL 16+
- Redis 7+

### Installation

```bash
# Clone the repository
git clone https://github.com/parable-ai/parable.git
cd parable

# Install Python dependencies
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
pip install -e packages/core

# Install Node dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
alembic upgrade head

# Start development servers
npm run dev
```

### Usage

```python
from parable.core import CausalEngine

# Initialize engine
engine = CausalEngine()

# Load your data
data = engine.load("my_data.csv")

# Discover causal relationships
graph = engine.discover(data)

# Test a specific causal claim
finding = engine.test_causal(
    treatment="exercise",
    outcome="mood",
    method="backdoor"
)

print(finding.summary)
# "We've found that exercise has a positive effect on mood 
#  (effect size: 0.42, confidence: Established)"
```

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   Web App   │     │  Mobile App │     │  Enterprise API │
│  (Next.js)  │     │(React Native│     │   (REST/GraphQL)│
└──────┬──────┘     └──────┬──────┘     └────────┬────────┘
       │                   │                     │
       └───────────────────┼─────────────────────┘
                           │
                    ┌──────┴──────┐
                    │  API Gateway │
                    │   (Kong)     │
                    └──────┬──────┘
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
┌──────┴──────┐    ┌──────┴──────┐    ┌──────┴──────┐
│  Ingestion   │    │   Query     │    │Communication│
│  Service     │    │  Service    │    │  Service    │
│  (FastAPI)   │    │ (FastAPI)   │    │ (FastAPI)   │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
              ┌───────────┴───────────┐
              │    Causal Engine      │
              │  (Python - Core IP)   │
              └───────────┬───────────┘
                          │
       ┌──────────────────┼──────────────────┐
       │                  │                  │
┌──────┴──────┐    ┌──────┴──────┐    ┌──────┴──────┐
│ PostgreSQL   │    │ TimescaleDB │    │    Redis    │
│ (Metadata)   │    │(Time-Series)│    │   (Cache)   │
└─────────────┘     └─────────────┘     └─────────────┘
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full architecture document.

## 📦 Packages

| Package | Description | Language |
|---------|-------------|----------|
| `packages/core` | Causal inference engine | Python |
| `packages/shared` | Shared types and utilities | TypeScript |
| `packages/ui` | Component library | TypeScript/React |
| `apps/web` | Web application | Next.js |
| `apps/api` | API backend | FastAPI |
| `apps/mobile` | Mobile application | React Native |

## 🧪 Testing

```bash
# Run all tests
npm test

# Run Python tests
pytest packages/core/tests/

# Run web tests
npm run test:web

# Run with coverage
npm run test:coverage
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

The open-source core (`packages/core`) is MIT licensed. Enterprise features and the hosted platform are proprietary.

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=parable-ai/parable&type=Date)](https://star-history.com/#parable-ai/parable&Date)

## 🔗 Links

- [Documentation](https://docs.parable.ai)
- [API Reference](https://api.parable.ai/docs)
- [Blog](https://blog.parable.ai)
- [Twitter/X](https://x.com/parable_ai)
- [Discord Community](https://discord.gg/parable)

---

<p align="center">
  Built with ❤️ by the Parable team
</p>
