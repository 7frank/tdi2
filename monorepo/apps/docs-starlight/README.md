# TDI2 Documentation Site

[![Built with Starlight](https://astro.badg.es/v2/built-with-starlight/tiny.svg)](https://starlight.astro.build)

This is the official documentation site for TDI2 (TypeScript Dependency Injection Attempt #2), built with [Starlight](https://starlight.astro.build/), a modern documentation framework.

## 🚀 Quick Start

```bash
cd monorepo/apps/docs-starlight
bun install
bun run dev
```

Visit `http://localhost:4321` to view the documentation site.

## 📖 Documentation Overview

### Getting Started
- **[Quick Start](./src/content/docs/getting-started/quick-start.md)** - 5-minute setup guide with ProductService example
- **[Service Patterns](./src/content/docs/patterns/service-patterns.md)** - Core patterns and best practices

### Architecture & Patterns
- **[Controller vs Service Pattern](./src/content/docs/guides/architecture/controller-service-pattern.md)** - Critical architectural distinction
- **[Component Transformation](./src/content/docs/guides/component-transformation.md)** - Migrating React components to TDI2

### Enterprise Guides
- **[Implementation Strategy](./src/content/docs/guides/enterprise/implementation.md)** - 4-phase enterprise adoption plan
- **[Migration Strategy](./src/content/docs/guides/migration/strategy.md)** - Systematic migration from Redux/Context
- **[Team Onboarding](./src/content/docs/guides/enterprise/onboarding.md)** - 5-day structured learning program

### Package Documentation
- **[@tdi2/di-core](./src/content/docs/packages/di-core/overview.md)** - Core dependency injection system
- **[@tdi2/vite-plugin-di](./src/content/docs/packages/vite-plugin-di/overview.md)** - Build-time transformation plugin

### Examples & Case Studies
- **[Complete E-Commerce Application](./src/content/docs/examples/ecommerce-case-study.md)** - Full implementation with ProductService, CartService, UserService, CheckoutService

### Research & Analysis
- **[Market Analysis](./src/content/docs/research/market-analysis.md)** - Target user segments and pain points
- **[Clean Architecture Analysis](./src/content/docs/research/clean-architecture-analysis.md)** - SOLID principles compliance
- **[Evaluation Plan](./src/content/docs/research/evaluation-plan.md)** - Systematic validation approach

### Framework Comparisons
- **[Redux vs TDI2](./src/content/docs/comparison/redux-vs-tdi2.md)** - Detailed comparison showing 60% code reduction

## 🛠️ Development Commands

| Command              | Action                                           |
| :------------------- | :----------------------------------------------- |
| `bun install`        | Install dependencies                             |
| `bun run dev`        | Start local dev server at `localhost:4321`      |
| `bun run build`      | Build production site to `./dist/`              |
| `bun run preview`    | Preview build locally                           |
| `bun run check`      | Check for broken links and issues              |

## 📁 Content Structure

```
src/content/docs/
├── getting-started/       # Getting started guides
├── patterns/              # Core patterns and concepts
├── guides/                # Implementation guides
│   ├── architecture/      # Architectural patterns
│   ├── enterprise/        # Enterprise-specific guides
│   └── migration/         # Migration strategies
├── packages/              # Package-specific documentation
│   ├── di-core/          # Core DI package docs
│   └── vite-plugin-di/   # Plugin documentation
├── examples/              # Complete examples and case studies
├── research/              # Research and analysis
├── comparison/            # Framework comparisons
└── reference/             # API reference (auto-generated)
```

## 📝 Content Guidelines

All examples use consistent **e-commerce domain models**:
- **ProductService** - Product catalog and search
- **CartService** - Shopping cart management  
- **UserService** - Authentication and profiles
- **CheckoutService** - Order processing
- **PaymentService** - Payment handling

Documentation focuses on:
- **Practical examples** with working code snippets
- **Progressive complexity** from basic to enterprise patterns
- **Business scenarios** not toy examples
- **Links to interactive demos** in di-test-harness

## 🚀 Deployment

### GitHub Pages (Automatic)
The documentation is automatically built and deployed to GitHub Pages on every push to `main`:
- **Live Site**: `https://7frank.github.io/tdi2/`
- **Test Harness**: `https://7frank.github.io/tdi2/test-harness/`

### Manual Deployment
The site builds to static files for deployment to other services:

```bash
bun run build  # Output: ./dist/
```

Deploy `./dist/` to any static hosting service (Vercel, Netlify, etc.).

## 📚 More Information

- [TDI2 Repository](https://github.com/7frank/tdi2)
- [Starlight Documentation](https://starlight.astro.build/)
- [Astro Documentation](https://docs.astro.build)
