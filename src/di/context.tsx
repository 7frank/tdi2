// src/di/context.tsx

import React, { createContext, useContext, ReactNode } from "react";
import { type DIContainer } from "./types";
import { CompileTimeDIContainer } from "./container";

const DIContext = createContext<DIContainer | null>(null);

interface DIProviderProps {
  container?: DIContainer;
  children: ReactNode;
}

export function DIProvider({ container, children }: DIProviderProps) {
  const diContainer = container || new CompileTimeDIContainer();

  return (
    <DIContext.Provider value={diContainer}>{children}</DIContext.Provider>
  );
}

export function useDI(): DIContainer {
  const container = useContext(DIContext);
  if (!container) {
    throw new Error("useDI must be used within a DIProvider");
  }
  return container;
}

export function useService<T>(
  token: string | symbol | (new (...args: any[]) => T)
): T {
  const container = useDI();
  return container.resolve<T>(token);
}
