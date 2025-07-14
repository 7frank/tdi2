import React, { useState, useEffect } from "react";
import type { Story } from "@ladle/react";
import { SimpleAnimalComponent } from "../components/SimpleAnimalComponent";
import { CompileTimeDIContainer } from "@tdi2/di-core/container";
import { DIProvider } from "@tdi2/di-core/context";

import { DI_CONFIG } from "../.tdi2/di-config";
import { ErrorBoundary } from "../utils/ErrorBoundary";
// Create and configure the DI container
const container = new CompileTimeDIContainer();
container.loadConfiguration(DI_CONFIG);

// Debug: Show registered services
const registeredTokens = container.getRegisteredTokens();
console.log("✅ Registered services:", registeredTokens);

// Enhanced debug info
console.log("🔍 Detailed container state:");
(container as any).debugContainer();

export const ASimpleAnimal: Story = () => {
  return (
     <ErrorBoundary>
      <DIProvider container={container}>
        <SimpleAnimalComponent />
      </DIProvider>
    </ErrorBoundary>
  );
};
