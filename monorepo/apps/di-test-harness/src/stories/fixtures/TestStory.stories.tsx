import type { Story } from "@ladle/react";
import { lazy } from "../../utils/simpleLazy";
import { DITransformationDemo } from "../../utils/DITransformationDemo";
import { CompileTimeDIContainer } from "@tdi2/di-core/container";
import { DI_CONFIG } from "../../.tdi2/di-config";

// Import the transformed component for live demo
const InlineDestructured = lazy(
  () =>
    import("@tdi2/di-core/examples/inline-destructured.basic.transformed.snap"),
  "InlineDestructured"
);

// Create and configure the DI container
const container = new CompileTimeDIContainer();
container.loadConfiguration(DI_CONFIG);

export const AInlineDestructuredTransformation: Story = () => {
  return (
    <DITransformationDemo
      diContainer={container}
      sourceImport={() =>
        import("@tdi2/di-core/sources/inline-destructured.basic.input.tsx?raw")
      }
      destImport={() =>
        import(
          "@tdi2/di-core/sources/inline-destructured.basic.transformed.snap.tsx?raw"
        )
      }
      transformedComponent={InlineDestructured}
      title="Inline Destructured Props Transformation"
      originalFileName="inline-destructured.basic.input.tsx"
      transformedFileName="inline-destructured.basic.transformed.snap.tsx"
    />
  );
};
