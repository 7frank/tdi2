import type { Story } from "@ladle/react";
import { CompileTimeDIContainer } from "@tdi2/di-core/container";
import { DIProvider } from "@tdi2/di-core/context";
import { DI_CONFIG } from "../.tdi2/di-config";

import { lazy } from "../utils/simpleLazy";
import { DIStory } from "../utils/DIStory";

const SimpleAnimalComponent = lazy(
  () => import("../components/SimpleAnimalComponent"),
  "SimpleAnimalComponent"
);

// Create and configure the DI container
const container = new CompileTimeDIContainer();
container.loadConfiguration(DI_CONFIG);

export const ASimpleAnimal: Story = () => {
  return (
    <DIStory>
      <DIProvider container={container}>
        <SimpleAnimalComponent />
      </DIProvider>
    </DIStory>
  );
};
