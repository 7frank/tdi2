import type { Story } from "@ladle/react";
import { CompileTimeDIContainer } from "@tdi2/di-core/container";
import { DIProvider } from "@tdi2/di-core/context";

// import { EnhancedDITransformer } from "@tdi2/di-core/tools";

import { DI_CONFIG } from "../.tdi2/di-config";
import { ErrorBoundary } from "../utils/ErrorBoundary";
import { DestructuredKeysExample } from "../components/DestructuredKeysExample";
// Create and configure the DI container
const container = new CompileTimeDIContainer();
container.loadConfiguration(DI_CONFIG);

// Debug: Show registered services
const registeredTokens = container.getRegisteredTokens();
console.log("✅ Registered services:", registeredTokens);

// Enhanced debug info
console.log("🔍 Detailed container state:");
(container as any).debugContainer();

export const ADestructuredKeysExample: Story = () => {
  return (
    <ErrorBoundary>
      <DIProvider container={container}>
        <DestructuredKeysExample />
      </DIProvider>
    </ErrorBoundary>
  );
};
