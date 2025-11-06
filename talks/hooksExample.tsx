// access-control-hooks.tsx
// Drop-in hook implementations for AccessControl.tsx
// Minimal, framework-agnostic, customizable via Providers.
// Roles/permissions are taken from the authenticated user object by default:
//   user.roles?: string[]
//   user.permissions?: string[]
//
// Replace/extend adapters as needed to integrate with your auth backend.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";

// ===== Shared types =====
export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type Session = {
  user: unknown | null;
  token?: string | null;
};

type AuthValue = {
  status: AuthStatus;
  user: unknown | null;
  token?: string | null;
  error?: unknown;
  signIn?: (...args: any[]) => Promise<void> | void;
  signOut?: (...args: any[]) => Promise<void> | void;
};

type AuthorizationValue = {
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  can: (perm: string) => boolean;
  cannot: (perm: string) => boolean;
};

type UserDataValue<T = any> = {
  data: T | null;
  refetch?: () => Promise<T | null>;
};

type LoggerValue = {
  log: (msg: string, meta?: Record<string, any>) => void;
  logWarn: (msg: string, meta?: Record<string, any>) => void;
  logError: (msg: string, meta?: Record<string, any>) => void;
  logEvent?: (name: string, meta?: Record<string, any>) => void;
};

// ===== Auth Provider =====

type AuthAdapter = {
  // Perform sign-in; return session or throw on failure.
  signIn?: (...args: any[]) => Promise<Session> | Session;
  // Perform sign-out (e.g., revoke tokens).
  signOut?: (...args: any[]) => Promise<void> | void;
  // Optional initial session loader (e.g., from storage or API).
  loadInitialSession?: () => Promise<Session | null> | Session | null;
  // Optional subscription to auth state changes; return unsubscribe fn.
  onAuthStateChanged?: (cb: (s: Session | null) => void) => () => void;
};

const AuthCtx = createContext<AuthValue | null>(null);

export function AuthProvider({
  children,
  adapter,
  persistKey = "auth.session",
  initialStatus = "loading",
}: {
  children: ReactNode;
  adapter?: AuthAdapter;
  persistKey?: string;
  initialStatus?: AuthStatus;
}) {
  const [status, setStatus] = useState<AuthStatus>(initialStatus);
  const [user, setUser] = useState<unknown | null>(null);
  const [token, setToken] = useState<string | null | undefined>(null);
  const [error, setError] = useState<unknown>(null);

  // Load from adapter or localStorage
  useEffect(() => {
    let mounted = true;

    const fromStorage = (): Session | null => {
      try {
        const raw = localStorage.getItem(persistKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") return parsed as Session;
        return null;
      } catch {
        return null;
      }
    };

    const toStorage = (s: Session | null) => {
      try {
        if (!s) {
          localStorage.removeItem(persistKey);
        } else {
          localStorage.setItem(persistKey, JSON.stringify(s));
        }
      } catch {
        // ignore storage errors
      }
    };

    const setFromSession = (s: Session | null) => {
      if (!mounted) return;
      if (s?.user) {
        setUser(s.user);
        setToken(s.token ?? null);
        setStatus("authenticated");
        toStorage(s);
      } else {
        setUser(null);
        setToken(null);
        setStatus("unauthenticated");
        toStorage(null);
      }
    };

    (async () => {
      try {
        setStatus("loading");
        if (adapter?.loadInitialSession) {
          const s = await adapter.loadInitialSession();
          setFromSession(s);
        } else {
          // Fallback to localStorage
          const s = fromStorage();
          setFromSession(s);
        }
      } catch (e) {
        setError(e);
        setFromSession(null);
      }
    })();

    let unsub: (() => void) | undefined;
    if (adapter?.onAuthStateChanged) {
      unsub = adapter.onAuthStateChanged((s) => setFromSession(s));
    }

    return () => {
      mounted = false;
      unsub?.();
    };
  }, [adapter, persistKey]);

  const signIn = useCallback<NonNullable<AuthValue["signIn"]>>(
    async (...args: any[]) => {
      try {
        setStatus("loading");
        const result =
          (await adapter?.signIn?.(...args)) ??
          // Minimal local demo: first arg is user object, second is token
          ({ user: args[0] ?? { id: "demo" }, token: args[1] ?? null } as Session);
        if (!result?.user) throw new Error("signIn: no user returned");
        setUser(result.user);
        setToken(result.token ?? null);
        setStatus("authenticated");
        localStorage.setItem(persistKey, JSON.stringify(result));
      } catch (e) {
        setError(e);
        setUser(null);
        setToken(null);
        setStatus("unauthenticated");
        localStorage.removeItem(persistKey);
        throw e;
      }
    },
    [adapter, persistKey]
  );

  const signOut = useCallback<NonNullable<AuthValue["signOut"]>>(
    async (...args: any[]) => {
      try {
        await adapter?.signOut?.(...args);
      } finally {
        setUser(null);
        setToken(null);
        setStatus("unauthenticated");
        localStorage.removeItem(persistKey);
      }
    },
    [adapter, persistKey]
  );

  const value = useMemo<AuthValue>(
    () => ({ status, user, token, error, signIn, signOut }),
    [status, user, token, error, signIn, signOut]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

// ===== Authorization Provider =====

const AuthorizationCtx = createContext<AuthorizationValue | null>(null);

export function AuthorizationProvider({
  children,
  inferFromUser = true,
  getRoles,
  getPermissions,
}: {
  children: ReactNode;
  // If true, derive roles/permissions from useAuth().user
  inferFromUser?: boolean;
  // Custom extractors; ignored if inferFromUser=false unless you still call them yourself.
  getRoles?: (user: unknown) => readonly string[] | string[] | undefined;
  getPermissions?: (user: unknown) => readonly string[] | string[] | undefined;
}) {
  const { user } = useAuth();

  const roles = useMemo<string[]>(() => {
    if (!inferFromUser) return [];
    const r =
      (getRoles?.(user) ??
        // Default shape expectations
        ((user as any)?.roles as string[] | undefined) ??
        ((user as any)?.role ? [(user as any).role] : undefined)) ?? [];
    return Array.from(new Set(r.filter(Boolean).map(String)));
  }, [inferFromUser, getRoles, user]);

  const perms = useMemo<string[]>(() => {
    if (!inferFromUser) return [];
    const p =
      (getPermissions?.(user) ??
        ((user as any)?.permissions as string[] | undefined) ??
        ((user as any)?.perms as string[] | undefined)) ?? [];
    return Array.from(new Set(p.filter(Boolean).map(String)));
  }, [inferFromUser, getPermissions, user]);

  const hasRole = useCallback((role: string) => roles.includes(role), [roles]);

  const hasAnyRole = useCallback(
    (rs: string[]) => rs.some((r) => roles.includes(r)),
    [roles]
  );

  const hasAllRoles = useCallback(
    (rs: string[]) => rs.every((r) => roles.includes(r)),
    [roles]
  );

  const can = useCallback((perm: string) => perms.includes(perm), [perms]);
  const cannot = useCallback((perm: string) => !perms.includes(perm), [perms]);

  const value = useMemo<AuthorizationValue>(
    () => ({ hasRole, hasAnyRole, hasAllRoles, can, cannot }),
    [hasRole, hasAnyRole, hasAllRoles, can, cannot]
  );

  return <AuthorizationCtx.Provider value={value}>{children}</AuthorizationCtx.Provider>;
}

export function useAuthorization(): AuthorizationValue {
  const ctx = useContext(AuthorizationCtx);
  if (!ctx) throw new Error("useAuthorization must be used within <AuthorizationProvider>");
  return ctx;
}

// ===== User Data Provider =====

const UserDataCtx = createContext<UserDataValue<any> | null>(null);

export function UserDataProvider<T = any>({
  children,
  loader,
  deps = [],
  disabled = false,
}: {
  children: ReactNode;
  // Provide a function to fetch user-specific data; can use useAuth() inside.
  loader?: () => Promise<T | null> | T | null;
  // Re-run when any dependency changes.
  deps?: React.DependencyList;
  disabled?: boolean;
}) {
  const isMounted = useRef(true);
  const [data, setData] = useState<T | null>(null);

  const refetch = useCallback(async () => {
    if (!loader) return data;
    const result = await loader();
    if (isMounted.current) setData(result ?? null);
    return result ?? null;
  }, [loader, data]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (disabled) return;
    if (!loader) return;
    let cancelled = false;
    (async () => {
      const result = await loader();
      if (!cancelled && isMounted.current) setData(result ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [disabled, loader, ...deps]);

  const value = useMemo<UserDataValue<T>>(
    () => ({ data, refetch }),
    [data, refetch]
  );

  return <UserDataCtx.Provider value={value}>{children}</UserDataCtx.Provider>;
}

export function useUserData<T = any>(): UserDataValue<T> {
  const ctx = useContext(UserDataCtx);
  if (!ctx) throw new Error("useUserData must be used within <UserDataProvider>");
  return ctx as UserDataValue<T>;
}

// ===== Logger Provider =====

type LoggerAdapter = {
  log?: (msg: string, meta?: Record<string, any>) => void;
  warn?: (msg: string, meta?: Record<string, any>) => void;
  error?: (msg: string, meta?: Record<string, any>) => void;
  event?: (name: string, meta?: Record<string, any>) => void;
};

const LoggerCtx = createContext<LoggerValue | null>(null);

export function LoggerProvider({
  children,
  adapter,
  redactKeys = ["token", "password", "secret", "authorization", "auth", "accessToken"],
  prefix = "",
}: {
  children: ReactNode;
  adapter?: LoggerAdapter;
  redactKeys?: string[];
  prefix?: string;
}) {
  const redact = useCallback(
    (obj: any): any => {
      if (!obj || typeof obj !== "object") return obj ?? null;
      if (Array.isArray(obj)) return obj.map(redact);
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(obj)) {
        if (redactKeys.includes(k)) out[k] = "[REDACTED]";
        else if (v && typeof v === "object") out[k] = redact(v);
        else out[k] = v;
      }
      return out;
    },
    [redactKeys]
  );

  const base = useMemo(
    () => ({
      log: (msg: string, meta?: Record<string, any>) => {
        if (adapter?.log) adapter.log(msg, meta ? redact(meta) : undefined);
        else console.log(prefix + msg, meta ? redact(meta) : "");
      },
      logWarn: (msg: string, meta?: Record<string, any>) => {
        if (adapter?.warn) adapter.warn(msg, meta ? redact(meta) : undefined);
        else console.warn(prefix + msg, meta ? redact(meta) : "");
      },
      logError: (msg: string, meta?: Record<string, any>) => {
        if (adapter?.error) adapter.error(msg, meta ? redact(meta) : undefined);
        else console.error(prefix + msg, meta ? redact(meta) : "");
      },
      logEvent: (name: string, meta?: Record<string, any>) => {
        if (adapter?.event) adapter.event(name, meta ? redact(meta) : undefined);
        else console.info(prefix + `event:${name}`, meta ? redact(meta) : "");
      },
    }),
    [adapter, prefix, redact]
  );

  return <LoggerCtx.Provider value={base}>{children}</LoggerCtx.Provider>;
}

export function useLogger(): LoggerValue {
  const ctx = useContext(LoggerCtx);
  if (!ctx) throw new Error("useLogger must be used within <LoggerProvider>");
  return ctx;
}

// ===== Convenience Root Provider =====

export function AccessControlProviders({
  children,
  authAdapter,
  loggerAdapter,
  getRoles,
  getPermissions,
}: {
  children: ReactNode;
  authAdapter?: AuthAdapter;
  loggerAdapter?: LoggerAdapter;
  getRoles?: (user: unknown) => readonly string[] | string[] | undefined;
  getPermissions?: (user: unknown) => readonly string[] | string[] | undefined;
}) {
  return (
    <LoggerProvider adapter={loggerAdapter}>
      <AuthProvider adapter={authAdapter}>
        <AuthorizationProvider getRoles={getRoles} getPermissions={getPermissions}>
          <UserDataProvider>{children}</UserDataProvider>
        </AuthorizationProvider>
      </AuthProvider>
    </LoggerProvider>
  );
}

// ===== Example integration (optional):
// import { AccessControlProviders } from "./access-control-hooks";
// ReactDOM.createRoot(...).render(
//   <AccessControlProviders>
//     <App />
//   </AccessControlProviders>
// );
