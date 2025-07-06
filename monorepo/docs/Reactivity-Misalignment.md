# Applied vs Misapplied Reactivity in Front-End Architectures

## Overview

This document provides three examples—using TDI2 + Valtio, Zustand, and custom React Hooks—to demonstrate **correct and incorrect uses of reactivity** in UI architecture. The focus is on **control flow, reactivity boundaries**, and how improper state management patterns lead to architectural complexity, hidden side-effects, and poor debuggability.

**Goal:** Clarify when and where reactivity should be applied in UI systems, especially in contexts modeled as directed acyclic graphs (DAGs) of services and components.

---

## Control Flow and Reactivity

- **Reactivity is good at system boundaries**: receiving asynchronous input from user, network, or external sources.
- **Reactivity is bad inside core logic or between internal components/services**, where it obscures flow, introduces hidden dependencies, and breaks testability.

Correct patterns **preserve top-down data flow** and keep side-effects localized. Misapplied patterns distribute control flow through subscriptions, breaking containment and traceability.

---

## ✅ Good Example: TDI2 + Valtio

```ts
// UserService.ts
@Service()
class UserService {
  state = { user: null, loading: false }

  async loadUser(id: string) {
    this.state.loading = true
    this.state.user = await api.fetchUser(id)
    this.state.loading = false
  }
}

// UserProfile.tsx
function UserProfile({ services: { userService: Inject } }) {
  const userService = useService('UserService')
  return userService.state.user
    ? <div>{userService.state.user.name}</div>
    : userService.state.loading
      ? <div>Loading…</div>
      : <button onClick={() => userService.loadUser('42')}>Fetch user</button>
}
```

**Why it's good:**
- State is encapsulated inside the service.
- Reactivity is injected and transparent.
- Components remain declarative and stateless.
- Control flow is explicit and layered.

---

## ✅ Good Example: Zustand

```ts
// store.ts
import create from 'zustand'

export const useUserStore = create((set) => ({
  user: null,
  loading: false,
  loadUser: async (id) => {
    set({ loading: true })
    const user = await api.fetchUser(id)
    set({ user, loading: false })
  }
}))

// UserProfile.tsx
function UserProfile() {
  const { user, loading, loadUser } = useUserStore()
  return user
    ? <div>{user.name}</div>
    : loading
      ? <div>Loading…</div>
      : <button onClick={() => loadUser('42')}>Fetch user</button>
}
```

**Why it's good:**
- Centralized store for shared state.
- Imperative control via `loadUser`.
- No redundant fetching logic across components.
- Top-down state propagation preserved.

---

## ❌ Misapplied Reactivity: Hook-Centric

```ts
// useUser.ts
function useUser(id: string) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!id) return

    setLoading(true)
    api.fetchUser(id).then(u => {
      if (!cancelled) {
        setUser(u)
        setLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [id])

  return { user, loading }
}

// UserGreeting.tsx
function UserGreeting({ userId }) {
  const { user, loading } = useUser(userId)
  return <>{loading ? '...' : user ? `Hi ${user.name}` : 'No user'}</>
}
```

**Why it's bad:**
- Fetch logic duplicated across components.
- Control flow hidden inside hook internals.
- Reactivity is fragmented and unpredictable.
- Inconsistent state between consumers.

---

## Summary

| Pattern         | Control Flow | Reactivity Scope | Reusability | Debuggability | Verdict     |
|----------------|--------------|------------------|-------------|---------------|-------------|
| TDI2 + Valtio   | Explicit     | Boundary Only     | High        | High          | ✅ Recommended |
| Zustand         | Explicit     | Store Layer       | Moderate    | Moderate      | ✅ Recommended |
| Hook-Centric    | Hidden       | Component-Level   | Low         | Low           | ❌ Avoid      |

**Final Principle**: Use reactivity to **connect external signals** to your system, not to **compose internal logic**. Maintain deterministic, explicit control flow within the architecture.
