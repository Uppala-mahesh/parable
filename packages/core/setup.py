from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="parable-core",
    version="0.1.0",
    author="Parable Engineering Team",
    author_email="dev@parable.ai",
    description="Causal inference engine for the Parable platform",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/parable-ai/parable",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Intended Audience :: Science/Research",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Topic :: Scientific/Engineering :: Information Analysis",
    ],
    python_requires=">=3.11",
    install_requires=[
        "numpy>=1.24.0",
        "pandas>=2.0.0",
        "scipy>=1.11.0",
        "scikit-learn>=1.3.0",
        "statsmodels>=0.14.0",
        "networkx>=3.1",
        "pydantic>=2.0.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.4.0",
            "pytest-cov>=4.1.0",
            "black>=23.7.0",
            "ruff>=0.0.280",
            "mypy>=1.5.0",
            "pre-commit>=3.3.0",
        ],
        "full": [
            "dowhy>=0.10.0",
            "gcastle>=1.0.0",
            "causal-learn>=0.1.3.0",
        ],
    },
)
