# RSI Conference Presentation Makefile
# Professional presentation management with uv and mkslides

.PHONY: help install dev-install clean build serve watch export pdf \
        lint format test check pre-commit setup-dev validate \
        preview demo conference-check backup restore

# Default target
help: ## Show this help message
	@echo "RSI Conference Presentation - Make Commands"
	@echo "=========================================="
	@echo ""
	@echo "⚡ Quick One-Liners:"
	@echo "  make quick-test    # Setup + serve immediately"
	@echo "  make quick-serve   # Just serve (if already setup)"
	@echo "  make quick-build   # Quick build test"
	@echo ""
	@echo "📋 All Commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "🚀 Getting Started:"
	@echo "  make setup         # Full setup (recommended first time)"
	@echo "  make quick-test    # Quick setup + test"
	@echo "  make serve         # Start development server"
	@echo ""
	@echo "⚡ Direct UV Commands:"
	@echo "  uv run python -m mkslides serve slides/main.md"
	@echo "  uv run python -m mkslides build slides/main.md -d dist"

# Environment setup
setup: clean install dev-install setup-dev ## Complete setup for development
	@echo "✅ Setup complete! Run 'make serve' to start presenting"

install: ## Install package and dependencies with uv
	@echo "📦 Installing dependencies with uv..."
	@echo "🐍 Checking Python version (requires 3.12+)..."
	@python3 -c "import sys; exit(0 if sys.version_info >= (3,12) else 1)" || \
		(echo "❌ Python 3.12+ required for mkslides compatibility" && \
		 echo "Current version: $(python3 --version)" && \
		 echo "Please upgrade Python or use pyenv/conda to install Python 3.12+" && \
		 exit 1)
	uv sync
	@echo "✅ Dependencies installed"

dev-install: ## Install development dependencies
	@echo "🔧 Installing development dependencies..."
	uv sync --extra dev --extra docs
	@echo "✅ Development dependencies installed"

setup-dev: ## Setup development environment (pre-commit, etc.)
	@echo "🛠️  Setting up development environment..."
	# uv run pre-commit install
	@echo "✅ Development environment ready"

# Presentation management
serve: ## Start development server with live reload
	@echo "🚀 Starting presentation server..."
	@echo "📱 Open http://localhost:8000 in your browser"
	@echo "🔄 Live reload enabled - edit slides/main.md to see changes"
	@if [ ! -d ".venv" ]; then \
		echo "❌ Virtual environment not found. Run 'make install' first"; \
		exit 1; \
	fi
	uv run python -m mkslides serve slides/main.md

serve-m-lpz: ## Serve Meetup Leipzig.js presentation
	uv run python -m mkslides serve "slides/Meetup-Leipzig.js/slides.md"


watch: ## Watch for changes and rebuild automatically
	@echo "👀 Watching for changes..."
	uv run python scripts/watch_presentation.py

build: ## Build presentation files
	@echo "🏗️  Building presentation..."
	@mkdir -p dist
	@echo "📦 Building with mkslides..."
	uv run python -m mkslides build slides/main.md -d dist
	@echo "✅ Presentation built in dist/"
	@ls -la dist/index.html 2>/dev/null && echo "📁 Main file: dist/index.html" || echo "⚠️  Check dist/ directory for output files"

export: build ## Export presentation for conference delivery
	@echo "📦 Exporting conference package..."
	mkdir -p export
	
	# Copy built presentation
	cp -r dist/* export/
	
	# Generate PDF backup
	uv run python scripts/generate_pdf.py slides/main.md export/rsi-presentation-backup.pdf
	
	# Create conference package
	uv run python scripts/create_conference_package.py
	
	@echo "✅ Conference package ready in export/"
	@echo "📋 Package contents:"
	@ls -la export/

pdf: ## Generate PDF backup of presentation
	@echo "📄 Generating PDF backup..."
	mkdir -p dist
	uv run python scripts/generate_pdf.py slides/main.md dist/rsi-presentation.pdf
	@echo "✅ PDF generated: dist/rsi-presentation.pdf"

# Preview and testing
preview: build ## Preview presentation locally
	@echo "👁️  Opening presentation preview..."
	@if command -v open >/dev/null 2>&1; then \
		open dist/index.html; \
	elif command -v xdg-open >/dev/null 2>&1; then \
		xdg-open dist/index.html; \
	else \
		echo "📂 Open dist/index.html in your browser"; \
	fi

demo: ## Run demo code examples
	@echo "🎭 Running demo examples..."
	uv run python scripts/run_demos.py

conference-check: ## Validate presentation for conference requirements
	@echo "✅ Checking conference requirements..."
	uv run python scripts/conference_check.py
	@echo "📊 Generating metrics report..."
	uv run python scripts/generate_metrics.py

# Code quality
lint: ## Run linting checks
	@echo "🔍 Running linting checks..."
	uv run ruff check src/ scripts/
	uv run mypy src/ scripts/

format: ## Format code with black and ruff
	@echo "🎨 Formatting code..."
	uv run black src/ scripts/ tests/
	uv run ruff --fix src/ scripts/

test: ## Run tests
	@echo "🧪 Running tests..."
	uv run pytest tests/ -v --cov=src --cov-report=term-missing

check: lint test ## Run all checks (lint + test)
	@echo "✅ All checks passed!"

pre-commit: ## Run pre-commit hooks
	@echo "🔒 Running pre-commit hooks..."
	uv run pre-commit run --all-files

# Presentation content management
validate: ## Validate slide content and structure
	@echo "✅ Validating presentation content..."
	uv run python scripts/validate_slides.py slides/main.md
	@echo "📏 Checking presentation timing..."
	uv run python scripts/check_timing.py slides/main.md

# Conference-specific builds
export-leipzig-js: ## Build for React Summit (premium conference)
	@echo "🎯 Building for React Summit..."
	@mkdir -p dist/Meetup-Leipzig.js
	@echo "📦 Building with mkslides..."
	uv run python -m mkslides build slides/Meetup-Leipzig.js/slides.md -d dist/Meetup-Leipzig.js
	@echo "✅ React Summit build ready in dist/Meetup-Leipzig.js/"
	@ls -la dist/Meetup-Leipzig.js/index.html && echo "📁 Open: dist/Meetup-Leipzig.js/index.html"

# Conference-specific builds
react-summit: ## Build for React Summit (premium conference)
	@echo "🎯 Building for React Summit..."
	@mkdir -p dist/react-summit
	@echo "📦 Building with mkslides..."
	uv run python -m mkslides build slides/main.md -d dist/react-summit
	@echo "✅ React Summit build ready in dist/react-summit/"
	@ls -la dist/react-summit/index.html && echo "📁 Open: dist/react-summit/index.html"

react-advanced: ## Build for React Advanced London
	@echo "🎯 Building for React Advanced..."
	@mkdir -p dist/react-advanced
	@echo "📦 Building with mkslides..."
	uv run python -m mkslides build slides/main.md -d dist/react-advanced
	@echo "✅ React Advanced build ready in dist/react-advanced/"
	@ls -la dist/react-advanced/index.html && echo "📁 Open: dist/react-advanced/index.html"

local-meetup: ## Build for local meetup (simplified version)
	@echo "🎯 Building for local meetup..."
	@mkdir -p dist/local-meetup
	@echo "📦 Building with mkslides..."
	uv run python -m mkslides build slides/main.md -d dist/local-meetup
	@echo "✅ Local meetup build ready in dist/local-meetup/"
	@ls -la dist/local-meetup/index.html && echo "📁 Open: dist/local-meetup/index.html"

# Backup and restore
backup: ## Backup current presentation state
	@echo "💾 Creating backup..."
	mkdir -p backups
	tar -czf backups/presentation-backup-$(shell date +%Y%m%d-%H%M%S).tar.gz \
		slides/ assets/ scripts/ src/
	@echo "✅ Backup created in backups/"

restore: ## Restore from backup (specify BACKUP_FILE=filename)
	@echo "🔄 Restoring from backup..."
	@if [ -z "$(BACKUP_FILE)" ]; then \
		echo "❌ Please specify BACKUP_FILE=filename"; \
		echo "Available backups:"; \
		ls -la backups/; \
		exit 1; \
	fi
	tar -xzf backups/$(BACKUP_FILE)
	@echo "✅ Restored from $(BACKUP_FILE)"

# Utilities
stats: ## Show presentation statistics
	@echo "📊 Presentation Statistics"
	@echo "========================="
	@echo "📄 Total slides: $(shell grep -c '^---$$' slides/main.md)"
	@echo "📝 Total lines: $(shell wc -l < slides/main.md)"
	@echo "💻 Code blocks: $(shell grep -c '```' slides/main.md)"
	@echo "🖼️  Images: $(shell grep -c '!\[' slides/main.md)"
	@echo ""
	@echo "📁 File sizes:"
	@du -h slides/main.md
	@du -h assets/ 2>/dev/null || echo "No assets directory"

# Clean up
clean: ## Clean build artifacts and cache
	@echo "🧹 Cleaning up..."
	rm -rf dist/ export/ .coverage htmlcov/ .pytest_cache/ .mypy_cache/ .ruff_cache/
	rm -rf src/*.egg-info/ build/
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@echo "✅ Cleanup complete"

clean-all: clean ## Clean everything including dependencies
	@echo "🧹 Deep cleaning..."
	rm -rf .venv/ uv.lock
	@echo "✅ Deep cleanup complete"

# Development helpers
new-slide: ## Add a new slide template (specify TITLE="Slide Title")
	@echo "➕ Adding new slide..."
	@if [ -z "$(TITLE)" ]; then \
		echo "❌ Please specify TITLE='Your Slide Title'"; \
		exit 1; \
	fi
	uv run python scripts/add_slide.py "$(TITLE)"

speaker-notes: ## Extract speaker notes to separate file
	@echo "📝 Extracting speaker notes..."
	uv run python scripts/extract_notes.py slides/main.md notes/speaker-notes.md

timing-check: ## Check presentation timing
	@echo "⏱️  Checking presentation timing..."
	uv run python scripts/check_timing.py slides/main.md

init-files: ## Create missing files and directories
	@echo "📁 Creating missing files and directories..."
	@mkdir -p src/rsi_presentation scripts slides assets/images assets/demos docs tests
	@touch src/rsi_presentation/__init__.py scripts/__init__.py tests/__init__.py
	@if [ ! -f "scripts/build_conference.py" ]; then \
		echo "⚠️  scripts/build_conference.py missing - run full setup"; \
	fi
	@if [ ! -f "LICENSE" ]; then \
		echo "⚠️  LICENSE file missing - creating basic MIT license"; \
		printf "MIT License\n\nCopyright (c) 2025 7Frank\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software...\n" > LICENSE; \
	fi
	@echo "✅ Basic structure created"
update: ## Update dependencies
	@echo "🔄 Updating dependencies..."
	uv lock --upgrade
	uv sync

freeze: ## Show dependency tree
	@echo "📋 Dependency tree:"
	uv tree

# CI/CD helpers
ci-setup: ## Setup for CI environment
	@echo "🤖 Setting up CI environment..."
	uv sync --extra dev

ci-test: ## Run tests in CI
	@echo "🧪 Running CI tests..."
	uv run pytest tests/ --cov=src --cov-report=xml --cov-report=term

ci-build: ## Build for CI/CD
	@echo "🏗️  Building for CI/CD..."
	$(MAKE) build
	$(MAKE) pdf
	$(MAKE) validate

# Documentation
docs: ## Build documentation
	@echo "📚 Building documentation..."
	uv run mkdocs build

docs-serve: ## Serve documentation locally
	@echo "📖 Serving documentation..."
	uv run mkdocs serve

# Release management
version: ## Show current version
	@echo "Current version: $(shell grep '^version = ' pyproject.toml | cut -d'"' -f2)"

bump-patch: ## Bump patch version
	@echo "🔼 Bumping patch version..."
	uv run python scripts/bump_version.py patch

bump-minor: ## Bump minor version
	@echo "🔼 Bumping minor version..."
	uv run python scripts/bump_version.py minor

bump-major: ## Bump major version
	@echo "🔼 Bumping major version..."
	uv run python scripts/bump_version.py major

# Quick one-liner commands
quick-test: ## One-liner test: setup and serve immediately
	@echo "⚡ Quick test: setup and serve..."
	uv venv --python 3.12 || true && uv sync && uv run python -m mkslides serve slides/main.md

quick-serve: ## One-liner serve (assumes dependencies installed)
	@echo "🚀 Quick serve..."
	uv run python -m mkslides serve slides/main.md

quick-build: ## One-liner build test
	@echo "⚡ Quick build test..."
	uv run python -m mkslides build slides/main.md -d quick-test && echo "✅ Build completed - check quick-test/index.html"
presentation-ready: clean build conference-check backup ## Final check before presentation
	@echo "🎬 Final presentation readiness check..."
	@echo "✅ Build completed"
	@echo "✅ Conference requirements validated"
	@echo "✅ Backup created"
	@echo ""
	@echo "🎯 You're ready to present!"
	@echo "📋 Quick commands:"
	@echo "   make serve    # Start development server"
	@echo "   make preview  # Open presentation in browser"
	@echo "   make pdf      # Generate PDF backup"

emergency-build: ## Emergency build with minimal checks
	@echo "🚨 Emergency build (minimal validation)..."
	mkdir -p dist
	uv run python -m mkslides build slides/main.md --output dist/index.html
	@echo "⚡ Emergency build ready in dist/"

# Print useful information
info: ## Show environment information
	@echo "🔍 Environment Information"
	@echo "========================="
	@echo "Python: $(shell python --version 2>/dev/null || echo 'Not found')"
	@echo "UV: $(shell uv --version 2>/dev/null || echo 'Not found')"
	@echo "mkslides: $(shell uv run python -m mkslides --version 2>/dev/null || echo 'Not installed')"
	@echo ""
	@echo "📁 Project structure:"
	@tree -L 2 -I '__pycache__|.git|.venv|*.pyc' 2>/dev/null || \
		find . -maxdepth 2 -type d | grep -E '^\.\/[^.]' | sort
	@echo ""
	@echo "⚡ One-liner commands:"
	@echo "  uv run python -m mkslides serve slides/main.md"
	@echo "  uv run python -m mkslides build slides/main.md -d dist"
	@echo "  make quick-test  # Setup + serve in one command"

# Quick actions for presentation day


dist-server: ## Start simple HTTP server for dist folder
	@echo "🌐 Starting HTTP server for dist folder..."
	@if [ ! -d "dist" ]; then \
		echo "❌ dist folder not found. Run 'make build' first"; \
		exit 1; \
	fi
	@echo "📁 Serving: $(shell pwd)/dist"
	@echo "📱 Open: http://localhost:8000"
	@echo "🛑 Press Ctrl+C to stop"
	@cd dist && python3 -m http.server 8000