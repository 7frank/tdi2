

import type { Story } from "@ladle/react";
import { CompileTimeDIContainer } from "@tdi2/di-core/container";

import { DI_CONFIG } from "../.tdi2/di-config";

import { lazy } from "../utils/simpleLazy";

const DestructuredKeysExample = lazy(
  () => import("../components/DestructuredKeysExample"),
  "DestructuredKeysExample"
);

// Create and configure the DI container
const container = new CompileTimeDIContainer();
container.loadConfiguration(DI_CONFIG);

import { DITransformationDemo } from "../utils/DITransformationDemo";

export const AInlineDestructuredTransformation: Story = () => {
  return (
    <DITransformationDemo
      diContainer={container}
      sourceImport={() => import("../components/DestructuredKeysExample.tsx?raw")}
      destImport={() => import("../components/DestructuredKeysExample.tsx?raw")}
      transformedComponent={DestructuredKeysExample}
      title="Inline Destructured Props Transformation"
      originalFileName="DestructuredKeysExample.tsx"
      transformedFileName="..."
    />
  );
};
