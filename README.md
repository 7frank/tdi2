# React Service Injection (RSI)

###### powered by <u>T</u>ypescript <u>D</u>ependency <u>I</u>njection Attempt #<u>2</u>

> [React doesn't scale](https://verved.ai/blog/react-doesn-t-scale) **until now?**



## Enterprise-Grade Architecture for Scalable React Applications

**The Problem**: React components drowning in props, state synchronization hell, testing nightmares.

**The Solution**: Move ALL state and logic to services. Zero props. Pure templates. Automatic synchronization.

---

## 📚 Documentation

**📖 [Live Documentation Site](https://7frank.github.io/tdi2/)** - Comprehensive guides, examples, and reference materials

**🧪 [Interactive Examples](https://7frank.github.io/tdi2/test-harness/)** - Live Storybook demonstrations

Quick Links:
- **[Quick Start Guide](https://7frank.github.io/tdi2/docs/getting-started/quick-start/)** - Get up and running in 5 minutes
- **[E-Commerce Case Study](https://7frank.github.io/tdi2/docs/examples/ecommerce-case-study/)** - Complete real-world example
- **[Enterprise Implementation](https://7frank.github.io/tdi2/docs/guides/enterprise/implementation/)** - Guide for large teams
- **[Architecture Patterns](https://7frank.github.io/tdi2/docs/guides/architecture/controller-service-pattern/)** - Controller vs Service pattern

## TL;DR

```typescript
// ❌ Before: Props hell, manual state management
function UserDashboard({ userId, userRole, permissions, theme, loading, onUpdate, ... }) {
  // 15+ props, complex useEffect chains, manual synchronization
}

// ✅ After: Zero props, automatic everything
function UserDashboard({ userService, appState }: {
  userService: Inject<UserServiceInterface>;
  appState: Inject<AppStateService>;
}) {
  return (
    <div className={`dashboard theme-${appState.state.theme}`}>
      <h1>{userService.state.currentUser?.name}</h1>
      <UserProfile />  {/* No props - gets data from services */}
    </div>
  );
}
```

**Result**: Components become templates. Services handle everything. Zero prop drilling. Automatic sync across your entire app.

---

## ⚠️ Disclaimer

**🧪 Experimental Technology**: RSI is currently experimental and only works in client-side environments. Server-side rendering (SSR) support is not yet implemented.

**📊 Performance Claims**: All performance metrics and benchmarks referenced in this documentation are currently placeholders and educated guesses. Real-world performance data is still being collected.

**📝 Documentation Status**: Most documentation is in draft form and requires peer review. We're actively seeking feedback from the React community.

**🤝 Contributing**: Found issues or have suggestions? Please [open an issue](https://github.com/your-repo/issues) or submit a pull request. Your feedback helps shape RSI's development.

> [see feature status](./Features.md) for the "production" ready system
> [see problems status](./PotentialProblems.md) for the "production" ready system



---

## Primary Targets

### 🏢 Enterprise React Teams (10+ developers)

- Prop drilling with 15+ props per component
- Multiple teams stepping on each other's code
- Testing complexity from mocking dozens of props
- No architectural boundaries or consistency

### 🎯 Dashboard/Admin Developers

- Complex state synchronization between components
- Performance issues from constant re-rendering
- Manual coordination between data views
- Zustand/Redux boilerplate for every feature

---

## Quick Start

1. **Install**: `npm install @tdi2/di-core @tdi2/vite-plugin-di valtio`
2. **Configure build pipeline** → [Setup Guide](https://7frank.github.io/tdi2/docs/getting-started/quick-start/)
3. **Create services** → [Service Patterns](https://7frank.github.io/tdi2/docs/guides/component-transformation/)
4. **Transform components** → [Component Guide](https://7frank.github.io/tdi2/docs/guides/component-transformation/)

---

## Why RSI Changes Everything

| Traditional React           | RSI Approach             |
| --------------------------- | ------------------------ |
| 15+ props per component     | 0 data props             |
| Manual state sync           | Automatic everywhere     |
| Complex component testing   | Pure template testing    |
| No architectural boundaries | Clear service boundaries |
| Prop drilling hell          | Direct service injection |

---

## Documentation

**Getting Started**

- [Quick Start Guide](https://7frank.github.io/tdi2/docs/getting-started/quick-start/) - Setup and first service
- [Component Transformation](https://7frank.github.io/tdi2/docs/guides/component-transformation/) - Converting existing components
- [API Reference](https://7frank.github.io/tdi2/docs/packages/di-core/overview/) - Complete package documentation

**Enterprise Implementation**

- [Enterprise Guide](https://7frank.github.io/tdi2/docs/guides/enterprise/implementation/) - Large team adoption
- [Team Onboarding](https://7frank.github.io/tdi2/docs/guides/enterprise/onboarding/) - Developer training
- [Migration Strategy](https://7frank.github.io/tdi2/docs/guides/migration/strategy/) - Systematic migration approach

**Architecture Deep Dive**

- [Why TDI2?](https://7frank.github.io/tdi2/docs/why-tdi2/react-problems/) - React's architectural problems
- [Architecture Principles](https://7frank.github.io/tdi2/docs/why-tdi2/architecture-principles/) - Service-oriented design
- [Framework Comparisons](https://7frank.github.io/tdi2/docs/comparison/redux-vs-tdi2/) - vs Redux, Context API, Zustand

**Advanced Guides**

- [Features & Roadmap](https://7frank.github.io/tdi2/docs/guides/advanced/features-roadmap/) - Production readiness status
- [Troubleshooting](https://7frank.github.io/tdi2/docs/guides/advanced/troubleshooting/) - Common issues and solutions
---

## Community

**Seeking feedback from:**

- Enterprise React teams struggling with scale
- Dashboard developers with sync issues
- Teams migrating from Angular to React

**Try RSI** in your next project and let us know how it works for your team.

---

## Additional Resources (Work in Progress)

> **Note**: The following documents are still in active development and may contain incomplete or outdated information. We welcome feedback and contributions.

**Core Concepts**
- [Motivation & Background](./monorepo/docs/Impuls.md) - Why RSI was created
- [Dependency Injection Foundation](./monorepo/docs/Whitepaper.md) - The underlying DI system
- [React Integration Details](./monorepo/docs/React-Whitepaper.md) - Core RSI innovation explained

**Examples & Patterns**
- [Working Example](./monorepo/docs/React-Example.md) - Complete implementation example
- [Service Recipes](./monorepo/docs/Recipes-and-Reactive-Services.md) - Common patterns and reactive services

**Analysis & Critique**
- [Design Principles](./docs/principles/) - Guidelines for maximizing RSI value

- [Known Issues](./monorepo/docs/KnownIssues.md) - Current limitations and planned fixes

**Planned Documentation**
- Migration Strategy - Phased rollout plan for existing applications
- Impact Assessment - Measuring RSI effectiveness in real projects

---

_Transforming React from component chaos to service-centric clarity._