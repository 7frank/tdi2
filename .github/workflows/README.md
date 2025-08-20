# GitHub Actions CI/CD

This repository uses GitHub Actions to automatically build and deploy documentation and interactive examples to GitHub Pages.

## Workflow Overview

The CI/CD pipeline (`ci.yml`) performs the following steps:

### Build Stage
1. **Setup Environment**: Node.js 18 + Bun latest
2. **Install Dependencies**: Monorepo dependencies via `bun install`
3. **Build Packages**: All packages via Turborepo (`bun run build`)
4. **Build Documentation**: Starlight documentation site (`bun run build`)
5. **Upload Artifacts**: Both test harness and documentation builds

### Deploy Stage (main branch only)
1. **Download Artifacts**: Documentation and test harness builds
2. **Combine Sites**: 
   - Documentation at root: `https://7frank.github.io/tdi2/`
   - Test harness at subfolder: `https://7frank.github.io/tdi2/test-harness/`
3. **Deploy to GitHub Pages**: Single deployment with both sites

## Site Structure

```
https://7frank.github.io/tdi2/
├── /                     # Documentation site (Starlight)
│   ├── getting-started/
│   ├── guides/
│   ├── examples/
│   ├── research/
│   └── ...
└── /test-harness/        # Interactive examples (Storybook)
    ├── storybook/
    └── ...
```

## Triggers

- **Push to main/develop**: Full build and deploy (main only)
- **Pull requests**: Build verification only
- **Tags (v*)**: Full build and deploy

## Configuration

### Documentation Site
- **Source**: `monorepo/apps/docs-starlight/`
- **Framework**: Astro + Starlight
- **Build**: `bun run build` → `dist/`
- **Base URL**: `/tdi2` (configured in `astro.config.mjs`)

### Test Harness
- **Source**: `monorepo/apps/di-test-harness/`
- **Framework**: Vite + Storybook
- **Build**: Turborepo build → `dist/`
- **Mount Point**: `/test-harness/`

## Local Development

```bash
# Documentation
cd monorepo/apps/docs-starlight
bun run dev  # localhost:4321

# Test Harness  
cd monorepo/apps/di-test-harness
bun run dev  # localhost:6006

# Both (from monorepo root)
bun run docs:dev    # Documentation only
bun run dev         # All apps via Turborepo
```

## Permissions

The workflow requires the following GitHub token permissions:
- `contents: read` - Repository access
- `pages: write` - GitHub Pages deployment
- `id-token: write` - OIDC token for deployment

These are automatically provided by GitHub when deploying to Pages.