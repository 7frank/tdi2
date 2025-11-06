// access-control-valtio-providers.tsx
// Full, self-contained Valtio implementation with a Providers component
// that mirrors the "AccessControlProviders" pattern from the hooks example.

import React, { ReactNode, useEffect } from "react";
import { proxy, subscribe as subscribeProxy } from "valtio/vanilla";
import { useSnapshot } from "valtio";

/* =========================
   Types
   ========================= */

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type Session = {
  user: unknown | null;
  token?: string | null;
};

export type AuthAdapter = {
  signIn?: (...args: any[]) => Promise<Session> | Session;
  signOut?: (...args: any[]) => Promise<void> | void;
  loadInitialSession?: () => Promise<Session | null> | Session | null;
  onAuthStateChanged?: (cb: (s: Session | null) => void) => () => void;
};

export type LoggerAdapter = {
  log?: (msg: string, meta?: Record<string, any>) => void;
  warn?: (msg: string, meta?: Record<string, any>) => void;
  error?: (msg: string, meta?: Record<string, any>) => void;
  event?: (name: string, meta?: Record<string, any>) => void;
};

export type RedactKeys = readonly string[];

/* =========================
   Utilities
   ========================= */

function redactDeep(obj: any, keys: RedactKeys): any {
  if (!obj || typeof obj !== "object") return obj ?? null;
  if (Array.isArray(obj)) return obj.map((v) => redactDeep(v, keys));
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (keys.includes(k)) out[k] = "[REDACTED]";
    else if (v && typeof v === "object") out[k] = redactDeep(v, keys);
    else out[k] = v;
  }
  return out;
}

/* =========================
   Logger Service  (useLogger facade)
   ========================= */

class LoggerService {
  state = proxy({
    prefix: "",
    redactKeys: ["token", "password", "secret", "authorization", "auth", "accessToken"] as RedactKeys,
  });

  private adapter?: LoggerAdapter;

  configure(opts: { adapter?: LoggerAdapter; prefix?: string; redactKeys?: RedactKeys } = {}) {
    this.adapter = opts.adapter ?? this.adapter;
    if (opts.prefix !== undefined) this.state.prefix = opts.prefix;
    if (opts.redactKeys !== undefined) this.state.redactKeys = opts.redactKeys;
  }

  log = (msg: string, meta?: Record<string, any>) => {
    const { prefix, redactKeys } = this.state;
    const m = meta ? redactDeep(meta, redactKeys) : undefined;
    if (this.adapter?.log) this.adapter.log(prefix + msg, m);
    else console.log(prefix + msg, m ?? "");
  };

  logWarn = (msg: string, meta?: Record<string, any>) => {
    const { prefix, redactKeys } = this.state;
    const m = meta ? redactDeep(meta, redactKeys) : undefined;
    if (this.adapter?.warn) this.adapter.warn(prefix + msg, m);
    else console.warn(prefix + msg, m ?? "");
  };

  logError = (msg: string, meta?: Record<string, any>) => {
    const { prefix, redactKeys } = this.state;
    const m = meta ? redactDeep(meta, redactKeys) : undefined;
    if (this.adapter?.error) this.adapter.error(prefix + msg, m);
    else console.error(prefix + msg, m ?? "");
  };

  logEvent = (name: string, meta?: Record<string, any>) => {
    const { prefix, redactKeys } = this.state;
    const m = meta ? redactDeep(meta, redactKeys) : undefined;
    if (this.adapter?.event) this.adapter.event(name, m);
    else console.info(prefix + `event:${name}`, m ?? "");
  };
}

export const logger = new LoggerService();

export function useLogger() {
  // Stateless facade
  return {
    log: logger.log,
    logWarn: logger.logWarn,
    logError: logger.logError,
    logEvent: logger.logEvent,
  };
}

/* =========================
   Auth Service (useAuth facade)
   ========================= */

class AuthService {
  state = proxy<{
    status: AuthStatus;
    user: unknown | null;
    token: string | null;
    error: unknown;
    persistKey: string;
  }>({
    status: "loading",
    user: null,
    token: null,
    error: null,
    persistKey: "auth.session",
  });

  private adapter?: AuthAdapter;
  private unsub?: () => void;

  configure(opts: { adapter?: AuthAdapter; persistKey?: string } = {}) {
    this.adapter = opts.adapter ?? this.adapter;
    if (opts.persistKey) this.state.persistKey = opts.persistKey;
  }

  private fromStorage(): Session | null {
    try {
      const raw = localStorage.getItem(this.state.persistKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed as Session;
      return null;
    } catch {
      return null;
    }
  }

  private toStorage(s: Session | null) {
    try {
      if (!s) localStorage.removeItem(this.state.persistKey);
      else localStorage.setItem(this.state.persistKey, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }

  private setFromSession(s: Session | null) {
    if (s?.user) {
      this.state.user = s.user;
      this.state.token = s.token ?? null;
      this.state.status = "authenticated";
      this.toStorage(s);
    } else {
      this.state.user = null;
      this.state.token = null;
      this.state.status = "unauthenticated";
      this.toStorage(null);
    }
  }

  async init() {
    this.state.status = "loading";
    try {
      if (this.adapter?.loadInitialSession) {
        const s = await this.adapter.loadInitialSession();
        this.setFromSession(s);
      } else {
        const s = this.fromStorage();
        this.setFromSession(s);
      }
    } catch (e) {
      this.state.error = e;
      this.setFromSession(null);
    }
    if (this.adapter?.onAuthStateChanged) {
      this.unsub?.();
      this.unsub = this.adapter.onAuthStateChanged((s) => this.setFromSession(s));
    }
  }

  destroy() {
    this.unsub?.();
    this.unsub = undefined;
  }

  signIn = async (...args: any[]) => {
    this.state.status = "loading";
    try {
      const result =
        (await this.adapter?.signIn?.(...args)) ??
        ({ user: args[0] ?? { id: "demo" }, token: args[1] ?? null } as Session);
      if (!result?.user) throw new Error("signIn: no user returned");
      this.state.user = result.user;
      this.state.token = result.token ?? null;
      this.state.status = "authenticated";
      this.toStorage(result);
      logger.log("auth:signin", { user: result.user });
    } catch (e) {
      this.state.error = e;
      this.state.user = null;
      this.state.token = null;
      this.state.status = "unauthenticated";
      this.toStorage(null);
      logger.logError("auth:signin:error", { error: e });
      throw e;
    }
  };

  signOut = async (...args: any[]) => {
    try {
      await this.adapter?.signOut?.(...args);
    } finally {
      this.state.user = null;
      this.state.token = null;
      this.state.status = "unauthenticated";
      this.toStorage(null);
      logger.log("auth:signout");
    }
  };
}

export const auth = new AuthService();

export function useAuth() {
  const snap = useSnapshot(auth.state);
  return {
    status: snap.status as AuthStatus,
    user: snap.user,
    token: snap.token,
    error: snap.error,
    signIn: auth.signIn,
    signOut: auth.signOut,
  };
}

/* =========================
   Authorization Service (useAuthorization facade)
   ========================= */

class AuthorizationService {
  state = proxy<{
    roles: string[];
    perms: string[];
    getRoles?: (user: unknown) => readonly string[] | string[] | undefined;
    getPermissions?: (user: unknown) => readonly string[] | string[] | undefined;
    inferFromUser: boolean;
  }>({
    roles: [],
    perms: [],
    inferFromUser: true,
    getRoles: undefined,
    getPermissions: undefined,
  });

  private unsubAuth?: () => void;

  configure(opts: {
    getRoles?: (user: unknown) => readonly string[] | string[] | undefined;
    getPermissions?: (user: unknown) => readonly string[] | string[] | undefined;
    inferFromUser?: boolean;
  } = {}) {
    if (opts.getRoles) this.state.getRoles = opts.getRoles;
    if (opts.getPermissions) this.state.getPermissions = opts.getPermissions;
    if (opts.inferFromUser !== undefined) this.state.inferFromUser = opts.inferFromUser;
    this.compute();
  }

  init() {
    this.unsubAuth?.();
    this.unsubAuth = subscribeProxy(auth.state, () => {
      this.compute();
    });
    this.compute();
  }

  destroy() {
    this.unsubAuth?.();
    this.unsubAuth = undefined;
  }

  private uniq(arr: (string | undefined | null | false)[]) {
    return Array.from(new Set(arr.filter(Boolean).map(String)));
  }

  private compute() {
    if (!this.state.inferFromUser) {
      this.state.roles = [];
      this.state.perms = [];
      return;
    }
    const u: any = auth.state.user;
    const roles =
      this.state.getRoles?.(u) ??
      (Array.isArray(u?.roles) ? u.roles : u?.role ? [u.role] : []) ??
      [];
    const perms =
      this.state.getPermissions?.(u) ??
      (Array.isArray(u?.permissions) ? u.permissions : Array.isArray(u?.perms) ? u.perms : []) ??
      [];
    this.state.roles = this.uniq(roles);
    this.state.perms = this.uniq(perms);
  }

  hasRole = (role: string) => this.state.roles.includes(role);
  hasAnyRole = (roles: string[]) => roles.some((r) => this.state.roles.includes(r));
  hasAllRoles = (roles: string[]) => roles.every((r) => this.state.roles.includes(r));
  can = (perm: string) => this.state.perms.includes(perm);
  cannot = (perm: string) => !this.state.perms.includes(perm);
}

export const authorization = new AuthorizationService();

export function useAuthorization() {
  useSnapshot(authorization.state);
  return {
    hasRole: authorization.hasRole,
    hasAnyRole: authorization.hasAnyRole,
    hasAllRoles: authorization.hasAllRoles,
    can: authorization.can,
    cannot: authorization.cannot,
  };
}

/* =========================
   User Data Service (useUserData facade)
   ========================= */

class UserDataService<T = any> {
  state = proxy<{ data: T | null }>({ data: null });

  private loader?: () => Promise<T | null> | T | null;
  private unsubAuth?: () => void;

  configure(opts: { loader?: () => Promise<T | null> | T | null } = {}) {
    this.loader = opts.loader ?? this.loader;
  }

  init({ refetchOnAuthChange = true }: { refetchOnAuthChange?: boolean } = {}) {
    if (refetchOnAuthChange) {
      this.unsubAuth?.();
      this.unsubAuth = subscribeProxy(auth.state, () => {
        void this.refetch();
      });
    }
    void this.refetch();
  }

  destroy() {
    this.unsubAuth?.();
    this.unsubAuth = undefined;
  }

  refetch = async (): Promise<T | null> => {
    if (!this.loader) return this.state.data;
    const out = await this.loader();
    this.state.data = (out ?? null) as T | null;
    return this.state.data;
  };
}

export const userData = new UserDataService<any>();

export function useUserData<T = any>() {
  const snap = useSnapshot(userData.state);
  return {
    data: (snap.data as T | null) ?? null,
    refetch: userData.refetch as () => Promise<T | null>,
  };
}

/* =========================
   Configuration + Lifecycle helpers
   ========================= */

export function configureAccessControl(opts: {
  authAdapter?: AuthAdapter;
  loggerAdapter?: LoggerAdapter;
  loggerPrefix?: string;
  loggerRedactKeys?: RedactKeys;
  authPersistKey?: string;
  getRoles?: (user: unknown) => readonly string[] | string[] | undefined;
  getPermissions?: (user: unknown) => readonly string[] | string[] | undefined;
  userDataLoader?: () => Promise<any> | any;
}) {
  logger.configure({
    adapter: opts.loggerAdapter,
    prefix: opts.loggerPrefix,
    redactKeys: opts.loggerRedactKeys,
  });
  auth.configure({ adapter: opts.authAdapter, persistKey: opts.authPersistKey });
  authorization.configure({
    getRoles: opts.getRoles,
    getPermissions: opts.getPermissions,
  });
  userData.configure({ loader: opts.userDataLoader });
}

export async function initAccessControl() {
  await auth.init();
  authorization.init();
  userData.init();
}

export function destroyAccessControl() {
  authorization.destroy();
  userData.destroy();
  auth.destroy();
}

/* =========================
   Providers component (Valtio version)
   Mirrors the hooks example's <AccessControlProviders>.
   ========================= */

export function AccessControlProviders({
  children,
  authAdapter,
  loggerAdapter,
  getRoles,
  getPermissions,
  loggerPrefix,
  loggerRedactKeys,
  authPersistKey,
  userDataLoader,
}: {
  children: ReactNode;
  authAdapter?: AuthAdapter;
  loggerAdapter?: LoggerAdapter;
  getRoles?: (user: unknown) => readonly string[] | string[] | undefined;
  getPermissions?: (user: unknown) => readonly string[] | string[] | undefined;
  loggerPrefix?: string;
  loggerRedactKeys?: RedactKeys;
  authPersistKey?: string;
  userDataLoader?: () => Promise<any> | any;
}) {
  useEffect(() => {
    configureAccessControl({
      authAdapter,
      loggerAdapter,
      loggerPrefix,
      loggerRedactKeys,
      authPersistKey,
      getRoles,
      getPermissions,
      userDataLoader,
    });
    void initAccessControl();
    return () => {
      destroyAccessControl();
    };
  }, [authAdapter, loggerAdapter, loggerPrefix, loggerRedactKeys, authPersistKey, getRoles, getPermissions, userDataLoader]);

  return <>{children}</>;
}

/* =========================
   Example integration (commented)
   =========================
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AccessControlProviders } from "./access-control-valtio-providers";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <AccessControlProviders
    authAdapter={{
      loadInitialSession: async () => {
        const raw = localStorage.getItem("auth.session");
        return raw ? JSON.parse(raw) : null;
      },
      signIn: async (creds: { email: string; password: string }) => {
        return {
          user: { id: "u1", email: creds.email, roles: ["admin"], permissions: ["users:write"] },
          token: "demo-token",
        };
      },
      signOut: async () => {},
    }}
    getRoles={(u: any) => u?.roles ?? []}
    getPermissions={(u: any) => u?.permissions ?? []}
    userDataLoader={async () => {
      if (auth.state.status !== "authenticated") return null;
      return { profile: { name: "Ada" } };
    }}
  >
    <App />
  </AccessControlProviders>
);
*/
