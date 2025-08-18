# TDI2 Documentation Migration Plan
## From Scattered Docs to Unified Starlight Site

---

## Overview

**Goal**: Replace scattered documentation across multiple locations with a unified Starlight (Astro) documentation site that uses consistent e-commerce examples throughout.

**Current State**: Documentation exists in:
- `/docs/` - Root level markdown docs
- `/monorepo/docs/` - Monorepo-specific docs  
- `/monorepo/apps/docs/` - Incomplete NextJS docs app
- Package README files
- Inline code documentation

**Target State**: Single Starlight site at `/monorepo/apps/docs-starlight/` with:
- Unified e-commerce theme throughout all examples
- Working navigation (no broken links)
- Complete API documentation
- Enterprise implementation guides
- Migration strategies from existing React patterns

---

## Migration Phases

### ✅ Step 1: Migration Tracking Setup
- [x] Create `/Docs-Migration.md` (this document)
- [x] Document current state and target state
- [x] Define verification criteria for each phase

**Status**: ✅ COMPLETE

---

### ✅ Step 2: Starlight Infrastructure Setup

**Target**: Basic Starlight app ready for content migration

#### Tasks:
- [x] Create `/monorepo/apps/docs-starlight/` directory
- [x] Initialize Starlight with `npm create astro@latest -- --template starlight`
- [x] Configure `astro.config.mjs` with complete sidebar structure
- [x] Set up `package.json` with proper scripts and dependencies
- [x] Add to monorepo `turbo.json` and root `package.json` workspaces (already configured)
- [x] Configure TypeScript for decorators support
- [x] Test build and dev server
- [x] Create custom CSS with TDI2 branding
- [x] Create branded landing page with e-commerce examples

#### Verification Criteria:
- [x] `bun run dev` starts documentation site successfully
- [x] Sidebar shows working navigation structure (only existing pages)
- [x] Site branded as "TDI2 Documentation" 
- [x] Basic landing page exists with e-commerce theme
- [x] `bun run build` succeeds without errors
- [x] `bun run preview` works correctly
- [x] All sidebar links resolve to existing pages
- [x] Frontend is fully functional with no invalid slugs

**Status**: ✅ COMPLETE

---

### 🔄 Step 3: Phase 1 - Core Foundation

**Target**: Essential getting started content with working navigation

#### Content Migration:
- [ ] **Landing Page**: Combine `/docs/README.md` with e-commerce value proposition
- [ ] **Quick Start**: Migrate `/docs/Quick-Start.md` with e-commerce ProductService example
- [ ] **Service Patterns**: Migrate `/docs/Service-Patterns.md` with CartService, UserService examples
- [ ] **Component Guide**: Migrate `/docs/Component-Guide.md` with ProductList component transformation

#### E-Commerce Theme Requirements:
- [ ] All examples use ProductService, CartService, UserService, CheckoutService
- [ ] Replace abstract "CounterService" with "CartService" 
- [ ] Use realistic business scenarios (login, shopping, checkout)
- [ ] Examples show real-world complexity, not toy examples

#### Verification Criteria:
- [ ] All Phase 1 sidebar links resolve to actual pages
- [ ] Every code example uses e-commerce domain models
- [ ] Getting started tutorial results in working ProductService
- [ ] New developers can follow docs from installation to first service

**Status**: 🔄 PENDING

---

### 🔄 Step 4: Phase 2 - Package Documentation

**Target**: Complete reference documentation for both packages

#### @tdi2/di-core Documentation:
- [ ] **Overview**: Complete feature overview with e-commerce examples
- [ ] **API Reference**: All decorators, hooks, container methods
- [ ] **Service Lifecycle**: OnMount, OnUnmount, OnInit, OnDestroy examples
- [ ] **Testing Guide**: Service unit testing, component testing, mocking strategies
- [ ] **Best Practices**: Service design patterns, performance optimization

#### @tdi2/vite-plugin-di Documentation:
- [ ] **Overview**: Plugin features and transformation examples
- [ ] **Configuration**: Complete configuration options reference
- [ ] **Transformation Pipeline**: How code transformation works
- [ ] **Debug Tools**: Using debug output and verbose logging
- [ ] **Troubleshooting**: Common errors and solutions

#### Verification Criteria:
- [ ] Developers can implement any package feature using docs alone
- [ ] All configuration options are documented with examples
- [ ] Testing section includes real test files that work
- [ ] API reference is complete and accurate

**Status**: 🔄 PENDING

---

### 🔄 Step 5: Phase 3 - Enterprise & Migration

**Target**: Advanced implementation guidance for large teams

#### Enterprise Content:
- [ ] **Enterprise Implementation**: Migrate `/docs/Enterprise-Implementation.md`
  - [ ] Update examples to use e-commerce domain
  - [ ] Add section on team organization
  - [ ] Include enterprise architecture patterns
- [ ] **Migration Strategy**: Migrate `/docs/Migration-Strategy.md`
  - [ ] Add phased migration approach
  - [ ] Include migration from Redux, Context, Zustand
  - [ ] Provide codemods and migration tools
- [ ] **Team Onboarding**: Migrate `/docs/Team-Onboarding.md`
  - [ ] Update training materials
  - [ ] Add code review guidelines

#### Comparison Sections:
- [ ] **vs Redux**: Complete comparison with e-commerce cart implementation
- [ ] **vs Context**: Context Provider hell vs Service injection
- [ ] **vs Zustand**: Modern state management comparison
- [ ] **vs Angular DI**: Framework DI comparison

#### Verification Criteria:
- [ ] Enterprise teams have complete adoption roadmap
- [ ] Migration strategies address common scenarios
- [ ] Comparisons are fair and detailed
- [ ] All migration examples work with provided tools

**Status**: 🔄 PENDING

---

### 🔄 Step 6: Phase 4 - Research & Examples

**Target**: Complete case studies and validation research

#### Research Content Migration:
- [ ] **Market Analysis**: Migrate `/monorepo/docs/Market-Analysis.md`
- [ ] **Evaluation Plan**: Migrate `/monorepo/docs/EvaluationPlan.md`
- [ ] **Architecture Analysis**: Migrate SOLID principles analysis
- [ ] **Pain Points Analysis**: Migrate React pain points documentation

#### Complete E-Commerce Case Study:
- [ ] **Overview**: Complete working e-commerce application
- [ ] **Services**: ProductService, CartService, UserService, CheckoutService, PaymentService
- [ ] **Components**: ProductList, CartSummary, UserProfile, CheckoutFlow
- [ ] **Repository Layer**: API integration patterns
- [ ] **Testing**: Complete test suite for all services and components

#### Interactive Examples:
- [ ] **Integration with di-test-harness**: Live transformation demos via Storybook links
- [ ] **Playground**: Interactive service/component examples in di-test-harness
- [ ] **Code Snippets**: Copy-paste ready examples (start in markdown, move to di-test-harness later if needed)
- [ ] **Storybook Integration**: Link to di-test-harness Storybook for interactive demos

#### Verification Criteria:
- [ ] Case study is complete working application
- [ ] All research content properly migrated
- [ ] Interactive examples function correctly
- [ ] Examples can be copy-pasted and work immediately

**Status**: 🔄 PENDING

---

### 🔄 Step 7: Final Integration

**Target**: Complete migration with cleanup

#### Integration Tasks:
- [ ] **Update README files**: Keep README files in root/monorepo/apps/packages with links to new docs
- [ ] **Update CLAUDE.md**: Reference new documentation structure
- [ ] **Package.json scripts**: Add documentation commands to root
- [ ] **Remove old docs**: Archive or remove `/monorepo/apps/docs/` NextJS app
- [ ] **Link validation**: Ensure all internal and external links work
- [ ] **di-test-harness integration**: Link to interactive examples in Storybook

#### Deployment Setup:
- [ ] **Build process**: Integrate with monorepo build system
- [ ] **Deployment config**: Set up for Vercel/Netlify deployment
- [ ] **Domain setup**: Configure documentation domain with placeholder baseUrl
- [ ] **Placeholder URLs**: Use configurable baseUrl that can be replaced later

#### Verification Criteria:
- [ ] All links throughout repository point to new docs
- [ ] Old documentation systems removed or clearly marked as deprecated
- [ ] Documentation builds and deploys successfully
- [ ] Search functionality works across all content

**Status**: 🔄 PENDING

---

## Current Content Inventory

### Existing Documentation Files:

#### `/docs/` (Root Level)
- ✅ `README.md` - Main project overview and links
- ✅ `Quick-Start.md` - Getting started guide
- ✅ `Service-Patterns.md` - Service design patterns
- ✅ `Component-Guide.md` - Component transformation guide
- ✅ `Enterprise-Implementation.md` - Large team adoption
- ✅ `Migration-Strategy.md` - Migration from other patterns
- ✅ `Team-Onboarding.md` - Developer training
- ✅ `RSI-vs-Traditional.md` - Architecture comparison

#### `/monorepo/docs/` (Monorepo Level)
- ✅ `Market-Analysis.md` - User research and pain points
- ✅ `EvaluationPlan.md` - Validation methodology
- ✅ `RSI-Clean-Architecture-SOLID-Principles-Analysis.md` - Architecture analysis
- ✅ `React-Whitepaper.md` - Complete technical specification

#### Package Documentation
- ✅ `/monorepo/packages/di-core/README.md` - Core package overview
- ✅ `/monorepo/packages/vite-plugin-di/README.md` - Plugin documentation

### Target Content Organization:

```
docs-starlight/src/content/docs/
├── index.mdx                          # Landing page
├── getting-started/
│   ├── quick-start.md                 # From /docs/Quick-Start.md
│   ├── installation.md               # New content
│   └── first-service.md               # Tutorial
├── core-concepts/
│   ├── dependency-injection.md       # New comprehensive guide
│   ├── reactive-state.md             # Valtio integration
│   ├── services-vs-components.md     # Architecture transformation
│   └── transformation-pipeline.md    # How code transformation works
├── packages/
│   ├── di-core/
│   │   ├── overview.md               # Package overview
│   │   ├── api-reference.md          # Complete API docs
│   │   ├── testing.md                # Testing strategies
│   │   └── lifecycle.md              # Service lifecycle
│   └── vite-plugin-di/
│       ├── overview.md               # Plugin overview
│       ├── configuration.md          # Config options
│       └── troubleshooting.md        # Common issues
├── patterns/
│   └── service-patterns.md           # From /docs/Service-Patterns.md
├── guides/
│   ├── enterprise-implementation.md  # From /docs/Enterprise-Implementation.md
│   ├── migration-strategy.md         # From /docs/Migration-Strategy.md
│   ├── team-onboarding.md           # From /docs/Team-Onboarding.md
│   └── performance-optimization.md   # New content
├── comparison/
│   ├── overview.md                   # React pain points
│   ├── vs-redux.md                   # Redux comparison
│   ├── vs-context.md                 # Context API comparison
│   ├── vs-zustand.md                 # Zustand comparison
│   └── vs-angular.md                 # Angular DI comparison
├── examples/
│   └── ecommerce-case-study/
│       ├── overview.md               # Complete working example
│       ├── services.md               # Service implementations
│       ├── components.md             # Component transformations
│       └── testing.md                # Testing the application
└── research/
    ├── market-analysis.md            # From /monorepo/docs/Market-Analysis.md
    ├── evaluation-plan.md            # From /monorepo/docs/EvaluationPlan.md
    └── architecture-analysis.md      # SOLID principles analysis
```

---

## Verification Process

### Phase Completion Criteria:

Each phase must meet ALL verification criteria before proceeding to the next phase:

1. **Content Quality**: All examples use consistent e-commerce theme
2. **Navigation**: All sidebar links resolve to actual content  
3. **Completeness**: No major content gaps for the phase scope
4. **Accuracy**: All code examples work and are tested
5. **Clarity**: New developers can follow documentation successfully

### Review Process:

1. **Self-Review**: Complete all phase tasks
2. **Verification**: Test all verification criteria
3. **Documentation**: Update this document with completion status
4. **Approval**: Get explicit approval before proceeding to next phase

---

## Success Metrics

### Quantitative:
- [ ] 0 broken internal links
- [ ] 100% of code examples use e-commerce domain
- [ ] All package APIs documented with examples
- [ ] All migration scenarios covered

### Qualitative:
- [ ] New developers can implement TDI2 using docs alone
- [ ] Enterprise teams have clear adoption roadmap
- [ ] Documentation site is faster and more maintainable than previous system
- [ ] Examples feel realistic and immediately useful

---

## Notes and Decisions

### E-Commerce Domain Models:
```typescript
// Core business entities used throughout documentation
interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  preferences: UserPreferences;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  imageUrl: string;
  stock: number;
}

interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  createdAt: Date;
}
```

### Style Guidelines:
- Use realistic business scenarios, not toy examples
- Show complexity that developers actually face
- Include error handling and edge cases
- Demonstrate testing strategies for each pattern
- Focus on enterprise-scale concerns

---

*This document will be updated as each phase is completed.*