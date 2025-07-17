import type { Story } from "@ladle/react";
import { lazy } from "../../utils/simpleLazy";
import { DITransformationDemo } from "../../utils/DITransformationDemo";

// Import the transformed component for live demo
const InlineDestructured = lazy(
  () => import("@tdi2/di-core/examples/inline-destructured.basic.transformed.snap"),
  "InlineDestructured"
);

export const AInlineDestructuredTransformation: Story = () => {
  return (
    <DITransformationDemo
      sourceImport={() => import("@tdi2/di-core/sources/inline-destructured.basic.input.tsx?raw")}
      destImport={() => import("@tdi2/di-core/sources/inline-destructured.basic.transformed.snap.tsx?raw")}
      transformedComponent={InlineDestructured}
      title="Inline Destructured Props Transformation"
      originalFileName="inline-destructured.basic.input.tsx"
      transformedFileName="inline-destructured.basic.transformed.snap.tsx"
    />
  );
};

