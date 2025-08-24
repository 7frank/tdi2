import type { Story } from "@ladle/react";
import { CompileTimeDIContainer } from "@tdi2/di-core/container";

import { DI_CONFIG } from "../.tdi2/di-config";

import { lazy } from "../utils/simpleLazy";

const SimpleAnimalComponent = lazy(
  () => import("../components/SimpleAnimalComponent"),
  "SimpleAnimalComponent"
);

// Create and configure the DI container
const container = new CompileTimeDIContainer();
container.loadConfiguration(DI_CONFIG);

import { DITransformationDemo } from "../utils/DITransformationDemo";

export const ASimpleAnimalTransformation: Story = () => {
  return (
    <DITransformationDemo
      diContainer={container}
      sourceImport={() => import("../components/SimpleAnimalComponent.tsx?raw")}
      destImport={() => import("../components/SimpleAnimalComponent.tsx?raw")}
      transformedComponent={SimpleAnimalComponent}
      title="Inline Destructured Props Transformation"
      originalFileName="SimpleAnimalComponent.tsx"
      transformedFileName="..."
    />
  );
};
