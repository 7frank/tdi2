import type { Story } from "@ladle/react";
import { CompileTimeDIContainer } from "@tdi2/di-core/container";
import { DIProvider } from "@tdi2/di-core/context";
import { DI_CONFIG } from "../.tdi2/di-config";
import { lazy } from "../utils/simpleLazy";
import { DIStory } from "../utils/DIStory";

import source from "../components/DestructuredKeysExample.tsx?raw";

const DestructuredKeysExample = lazy(
  () => import("../components/DestructuredKeysExample"),
  "DestructuredKeysExample"
);

// Create and configure the DI container
const container = new CompileTimeDIContainer();
container.loadConfiguration(DI_CONFIG);

export const ADestructuredKeysExample: Story = () => {
  return (
    <DIStory>
      <DIProvider container={container}>
        <DestructuredKeysExample />
      </DIProvider>
      <pre>
        <code>{source}</code>
      </pre>
    </DIStory>
  );
};
