import type { Story } from "@ladle/react";
import { CompileTimeDIContainer } from "@tdi2/di-core/container";
import { DIProvider } from "@tdi2/di-core/context";
import { DI_CONFIG } from "../../.tdi2/di-config";

import { lazy } from "../../utils/simpleLazy";
import { DIStory } from "../../utils/DIStory";


//import { InlineDestructured } from "@tdi2/di-core/examples/inline-destructured.basic.input.js";
import { InlineDestructured } from "@tdi2/di-core/examples/tools/functional-di-enhanced-transformer/__tests__/__fixtures__/inline-destructured.basic.input.js";

//import source from "@tdi2/di-core/examples/tools/functional-di-enhanced-transformer/__tests__/__fixtures__/inline-destructured.basic.input";


const SimpleAnimalComponent = lazy(
  () => import("../../components/SimpleAnimalComponent"),
  "SimpleAnimalComponent"
);

// Create and configure the DI container
const container = new CompileTimeDIContainer();
container.loadConfiguration(DI_CONFIG);

export const ASimpleAnimal: Story = () => {
  return (
    <DIStory>
      <DIProvider container={container}>
        <InlineDestructured />
      </DIProvider>{" "}
      <pre>
      //  <code>{source}</code>
      </pre>
    </DIStory>
  );
};
