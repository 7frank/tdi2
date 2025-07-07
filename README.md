# React Service Injection (RSI)

> [React doesn't scale](https://verved.ai/blog/react-doesn-t-scale) **until now?**

## Enterprise-Grade Architecture for Scalable React Applications

**The Problem**: React components drowning in props, state synchronization hell, testing nightmares.

**The Solution**: Move ALL state and logic to services. Zero props. Pure templates. Automatic synchronization.

---

## TL;DR

- [Also this link](./monorepo/docs/Teaser.md)

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

1. **Install**: `npm install @tdi2/core @tdi2/vite-plugin valtio`
2. **Configure build pipeline** → [Setup Guide](./docs/Quick-Start.md)
3. **Create services** → [Service Patterns](./docs/Service-Patterns.md)
4. **Transform components** → [Component Guide](./docs/Component-Guide.md)

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

- [Quick Start Guide](./docs/Quick-Start.md) - Setup and first service
- [Component Transformation](./docs/Component-Guide.md) - Converting existing components
- [Service Patterns](./docs/Service-Patterns.md) - Creating reactive services

**Enterprise Implementation**

- [Enterprise Guide](./docs/Enterprise-Implementation.md) - Large team adoption
- [❌] [ [Migration Strategy](./docs/Migration-Strategy.md) - Phased rollout plan
- [Team Onboarding](./docs/Team-Onboarding.md) - Developer training

**Architecture Deep Dive**

- [Complete Architecture](./docs/React-Whitepaper.md) - Full technical spec
- [vs Traditional React](./docs/RSI-vs-Traditional.md) - Detailed comparison
- [SOLID Principles](./monorepo/docs/RSI-Clean-Architecture-SOLID-Principles-Analysis.md) - Architecture analysis

**Validation & Research**

- [Market Analysis](./monorepo/docs/Market-Analysis.md) - User research and pain points
- [Evaluation Plan](./monorepo/docs/EvaluationPlan.md) - Proving RSI effectiveness

---

## Community

**Seeking feedback from:**

- Enterprise React teams struggling with scale
- Dashboard developers with sync issues
- Teams migrating from Angular to React

**Try RSI** in your next project and let us know how it works for your team.

## Other Resources & WIP

- [Motivation](./monorepo/docs/Impuls.md)

- [KnownIssues](./monorepo/docs/KnownIssues.md)

- [DI](./monorepo/docs/Whitepaper.md)
  - explains the basis and first important step for the react functionality
  - [❌] needs redaction
- [React-DI](./monorepo/docs/React-Whitepaper.md)
  - the core innovation in detail
  - [❌] needs redaction

- [Example](./monorepo/docs/React-Example.md)
  - [❌] ensure this is still correct

- [Impact?](./monorepo/docs/Impact.md)
  - [❌] highly overselling / too confident
  - [❌] needs redaction

- [Comparison](./monorepo/docs/React%20Service%20Injection%20vs%20Traditional%20State%20Management.md)
  - [❌] needs redaction

- [❌][recipes & rectivity](./monorepo/docs/Recipes-and-Reactive-Services.md)

- [❌][React Service Injection vs Traditional State Management](./monorepo/docs/React%20Service%20Injection%20vs%20Traditional%20State%20Management.md)

- [pain point analysis and comparision](./docs/pain-points/README.md)

---

_Transforming React from component chaos to service-centric clarity._
