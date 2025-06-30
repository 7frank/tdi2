// src/di/context.tsx - Enhanced with Valtio proxy state management
import * as React from "react";
import { createContext, useContext, type ReactNode } from "react";
import { proxy, useSnapshot } from "valtio";
import { type DIContainer } from "@tdi2/di-core/types";
import { CompileTimeDIContainer } from "@tdi2/di-core/container";

// Create a proxy state for DI container management
interface DIState {
  container: DIContainer | null;
  instances: Map<string | symbol, any>;
  lastResolvedService: string | null;
  resolveCount: number;
}

// Create the proxy state
const createDIState = (container?: DIContainer): DIState =>
  proxy({
    container: container || null,
    instances: new Map(),
    lastResolvedService: null,
    resolveCount: 0,
  });

const DIContext = createContext<DIState | null>(null);

interface DIProviderProps {
  container?: DIContainer;
  children: ReactNode;
}

export function DIProvider({ container, children }: DIProviderProps) {
  // Create a stable reference to the DI state using useRef
  const diState = React.useRef(
    createDIState(container || new CompileTimeDIContainer())
  ).current;

  // Update the container if it changes
  React.useEffect(() => {
    if (container && diState.container !== container) {
      diState.container = container;
      // Clear instances cache when container changes
      diState.instances.clear();
      diState.resolveCount = 0;
    }
  }, [container, diState]);

  return <DIContext.Provider value={diState}>{children}</DIContext.Provider>;
}

export function useDI(): DIContainer {
  const diState = useContext(DIContext);
  if (!diState) {
    throw new Error("useDI must be used within a DIProvider");
  }

  // Use useSnapshot to get reactive snapshot of the state
  const snap = useSnapshot(diState);

  if (!snap.container) {
    throw new Error("DI container is not available");
  }

  return snap.container;
}

/**
 * Hook to resolve a service from the DI container with Valtio state tracking
 */
export function useService<T>(
  token: string | symbol | (new (...args: any[]) => T)
): T {
  const diState = useContext(DIContext);
  if (!diState) {
    throw new Error("useService must be used within a DIProvider");
  }

  // Use useSnapshot for reactive updates
  const snap = useSnapshot(diState);

  if (!snap.container) {
    throw new Error("DI container is not available");
  }

  // Memoize the service resolution to avoid unnecessary re-resolutions
  const service = React.useMemo(() => {
    const tokenKey =
      typeof token === "symbol" ? token.toString() : String(token);

    // Check if service is already cached in our proxy state
    if (diState.instances.has(tokenKey)) {
      return diState.instances.get(tokenKey);
    }

    try {
      const resolvedService = snap.container!.resolve<T>(token);

      // Cache the resolved service in our proxy state (will trigger reactivity)
      diState.instances.set(tokenKey, resolvedService);
      diState.lastResolvedService = tokenKey;
      diState.resolveCount++;

      return resolvedService;
    } catch (error) {
      console.error(
        `Failed to resolve service for token: ${String(token)}`,
        error
      );
      throw error;
    }
  }, [token, snap.container, snap.resolveCount]); // Re-run if container or resolve count changes

  return service;
}

/**
 * Hook to optionally resolve a service from the DI container with Valtio state tracking
 * Returns undefined if the service is not registered
 */
export function useOptionalService<T>(
  token: string | symbol | (new (...args: any[]) => T)
): T | undefined {
  const diState = useContext(DIContext);
  if (!diState) {
    throw new Error("useOptionalService must be used within a DIProvider");
  }

  // Use useSnapshot for reactive updates
  const snap = useSnapshot(diState);

  if (!snap.container) {
    return undefined;
  }

  // Memoize the optional service resolution
  const service = React.useMemo(() => {
    const tokenKey =
      typeof token === "symbol" ? token.toString() : String(token);

    // Check if service is already cached in our proxy state
    if (diState.instances.has(tokenKey)) {
      return diState.instances.get(tokenKey);
    }

    try {
      if (snap.container!.has(token)) {
        const resolvedService = snap.container!.resolve<T>(token);

        // Cache the resolved service in our proxy state
        diState.instances.set(tokenKey, resolvedService);
        diState.lastResolvedService = tokenKey;
        diState.resolveCount++;

        return resolvedService;
      }
      return undefined;
    } catch (error) {
      console.warn(`Optional service not found for token: ${String(token)}`);
      return undefined;
    }
  }, [token, snap.container, snap.resolveCount]);

  return service;
}

/**
 * Hook to resolve multiple services at once with Valtio state tracking
 * Useful for functional components with many dependencies
 */
export function useServices<T extends Record<string, any>>(serviceMap: {
  [K in keyof T]: string | symbol;
}): T {
  const diState = useContext(DIContext);
  if (!diState) {
    throw new Error("useServices must be used within a DIProvider");
  }

  // Use useSnapshot for reactive updates
  const snap = useSnapshot(diState);

  if (!snap.container) {
    throw new Error("DI container is not available");
  }

  // Memoize the services object
  const services = React.useMemo(() => {
    const resolved = {} as T;

    for (const [key, token] of Object.entries(serviceMap)) {
      const tokenKey =
        typeof token === "symbol" ? token.toString() : String(token);

      // Check cache first
      if (diState.instances.has(tokenKey)) {
        resolved[key as keyof T] = diState.instances.get(tokenKey);
      } else {
        try {
          const service = snap.container!.resolve(token);

          // Cache the service
          diState.instances.set(tokenKey, service);
          diState.resolveCount++;

          resolved[key as keyof T] = service;
        } catch (error) {
          console.error(
            `Failed to resolve service for key ${key} with token: ${String(token)}`,
            error
          );
          throw error;
        }
      }
    }

    if (Object.keys(resolved).length > 0) {
      diState.lastResolvedService = Object.keys(serviceMap)[0];
    }

    return resolved;
  }, [serviceMap, snap.container, snap.resolveCount]);

  return services;
}

/**
 * Hook for functional DI pattern with Valtio state tracking
 * This would be generated by the transformer for functions with marker interfaces
 */
export function useFunctionalDI<T extends Record<string, any>>(
  dependencies: Array<{
    key: keyof T;
    token: string | symbol;
    optional?: boolean;
  }>
): T {
  const diState = useContext(DIContext);
  if (!diState) {
    throw new Error("useFunctionalDI must be used within a DIProvider");
  }

  // Use useSnapshot for reactive updates
  const snap = useSnapshot(diState);

  if (!snap.container) {
    throw new Error("DI container is not available");
  }

  // Memoize the functional DI services
  const services = React.useMemo(() => {
    const resolved = {} as T;

    for (const dep of dependencies) {
      const tokenKey =
        typeof dep.token === "symbol"
          ? dep.token.toString()
          : String(dep.token);

      // Check cache first
      if (diState.instances.has(tokenKey)) {
        resolved[dep.key] = diState.instances.get(tokenKey);
        continue;
      }

      if (dep.optional) {
        try {
          if (snap.container!.has(dep.token)) {
            const service = snap.container!.resolve(dep.token);

            // Cache the service
            diState.instances.set(tokenKey, service);
            diState.resolveCount++;

            resolved[dep.key] = service;
          }
          // Optional dependency not available - continue without error
        } catch (error) {
          console.warn(
            `Optional dependency not available: ${String(dep.token)}`
          );
          // Optional dependency not available - continue without setting the service
        }
      } else {
        try {
          const service = snap.container!.resolve(dep.token);

          // Cache the service
          diState.instances.set(tokenKey, service);
          diState.resolveCount++;

          resolved[dep.key] = service;
        } catch (error) {
          console.error(
            `Required dependency failed to resolve: ${String(dep.token)}`,
            error
          );
          throw error;
        }
      }
    }

    if (dependencies.length > 0) {
      diState.lastResolvedService = String(dependencies[0].token);
    }

    return resolved;
  }, [dependencies, snap.container, snap.resolveCount]);

  return services;
}

/**
 * Hook to get DI state information for debugging
 */
export function useDIState() {
  const diState = useContext(DIContext);
  if (!diState) {
    throw new Error("useDIState must be used within a DIProvider");
  }

  // Use useSnapshot to get reactive snapshot
  const snap = useSnapshot(diState);

  return {
    hasContainer: !!snap.container,
    instanceCount: snap.instances.size,
    lastResolvedService: snap.lastResolvedService,
    resolveCount: snap.resolveCount,
    // Helper method to check if a service is cached
    isServiceCached: (token: string | symbol) => {
      const tokenKey =
        typeof token === "symbol" ? token.toString() : String(token);
      return snap.instances.has(tokenKey);
    },
    // Helper method to clear the service cache
    clearCache: () => {
      diState.instances.clear();
      diState.resolveCount = 0;
      diState.lastResolvedService = null;
    },
  };
}

/**
 * Hook to invalidate specific services in the cache
 */
export function useDIInvalidation() {
  const diState = useContext(DIContext);
  if (!diState) {
    throw new Error("useDIInvalidation must be used within a DIProvider");
  }

  return {
    invalidateService: (token: string | symbol) => {
      const tokenKey =
        typeof token === "symbol" ? token.toString() : String(token);
      if (diState.instances.has(tokenKey)) {
        diState.instances.delete(tokenKey);
        diState.resolveCount++; // Trigger re-resolution
      }
    },
    invalidateAll: () => {
      diState.instances.clear();
      diState.resolveCount++;
      diState.lastResolvedService = null;
    },
    refreshContainer: () => {
      // Force re-resolution of all services
      diState.instances.clear();
      diState.resolveCount++;
      diState.lastResolvedService = null;
    },
  };
}
