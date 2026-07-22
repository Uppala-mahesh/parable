# Contributing to Parable

First off, thank you for considering contributing to Parable! It's people like you that make Parable a great tool for the community.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to see if the problem has already been reported. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce**
- **Provide specific examples** (commands, code snippets, data files)
- **Describe the behavior you observed** and why it's a problem
- **Include screenshots** if applicable

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a step-by-step description** of the suggested enhancement
- **Provide specific examples** to demonstrate the enhancement
- **Explain why this enhancement would be useful**

### Pull Requests

1. Fork the repository
2. Create a new branch from `main` (`git checkout -b feature/my-feature`)
3. Make your changes
4. Add or update tests as needed
5. Ensure all tests pass (`npm test` and `pytest`)
6. Update documentation if needed
7. Commit your changes with a clear commit message
8. Push to your fork
9. Open a Pull Request against `main`

## Development Setup

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 16+
- Redis 7+

### Setting Up Locally

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/parable.git
cd parable

# Set up Python environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Set up Node.js
npm install

# Set up pre-commit hooks
pre-commit install

# Run tests to verify setup
npm test
pytest
```

## Style Guidelines

### Python

- Follow [PEP 8](https://pep8.org/)
- Use [Black](https://black.readthedocs.io/) for formatting
- Use [isort](https://pycqa.github.io/isort/) for import sorting
- Use [mypy](https://mypy.readthedocs.io/) for type checking
- Docstrings follow [Google style](https://sphinxcontrib-napoleon.readthedocs.io/en/latest/example_google.html)

```bash
# Format Python code
black packages/core/
isort packages/core/
mypy packages/core/
```

### TypeScript / JavaScript

- Follow the project's ESLint configuration
- Use [Prettier](https://prettier.io/) for formatting
- Prefer functional components in React
- Use TypeScript for all new code

```bash
# Format TypeScript code
npm run format
npm run lint
```

## Testing

All contributions should include tests. We aim for high test coverage, especially in the causal engine.

```bash
# Run all tests
npm test
pytest

# Run with coverage
npm run test:coverage
pytest --cov=parable.core --cov-report=html
```

## Documentation

- Update the README.md if you change functionality
- Add docstrings to all public functions and classes
- Update ARCHITECTURE.md if you change the system architecture

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code changes that neither fix a bug nor add a feature
- `perf`: Performance improvements
- `test`: Adding or correcting tests
- `chore`: Changes to build process or auxiliary tools

Examples:
```
feat(core): add Granger causality test for time series
fix(api): resolve race condition in insight caching
docs(whitepaper): update benchmark results
```

## Review Process

- All PRs require at least one review from a maintainer
- CI must pass before merging
- Major changes require discussion in an issue first

## Questions?

Feel free to ask questions by:
- Opening an issue with the `question` label
- Joining our [Discord](https://discord.gg/parable)
- Emailing dev@parable.ai

Thank you for contributing! 🎉
