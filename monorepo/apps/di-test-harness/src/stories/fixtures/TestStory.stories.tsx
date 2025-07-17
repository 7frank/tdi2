import type { Story } from "@ladle/react";
import { CompileTimeDIContainer } from "@tdi2/di-core/container";
import { DIProvider } from "@tdi2/di-core/context";
import { DI_CONFIG } from "../../.tdi2/di-config";
import { lazy } from "../../utils/simpleLazy";
import { DIStory } from "../../utils/DIStory";
import { DiffView, DiffViewWithControls } from "../../utils/DiffView";

// Import the transformed component for live demo
const InlineDestructured = lazy(
  () =>
    import("@tdi2/di-core/examples/inline-destructured.basic.transformed.snap"),
  "InlineDestructured"
);

// Create and configure the DI container
const container = new CompileTimeDIContainer();
container.loadConfiguration(DI_CONFIG);

export const ADiffViewWithControls: Story = () => {
  return (
    <DIStory name="Interactive Diff View">
      <div style={{ padding: "1rem" }}>
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#e3f2fd",
            borderRadius: "6px",
            border: "1px solid #90caf9",
            marginBottom: "2rem",
          }}
        >
          <h2 style={{ marginTop: 0, color: "#1565c0" }}>
            🔍 Interactive Code Transformation Analysis
          </h2>
          <p style={{ color: "#1565c0", margin: "0.5rem 0" }}>
            Use the controls below to customize the diff view and explore how
            the DI transformer changes your code.
          </p>
        </div>

        <DiffViewWithControls
          originalImport={() =>
            import(
              "@tdi2/di-core/sources/inline-destructured.basic.input.tsx?raw"
            )
          }
          transformedImport={() =>
            import(
              "@tdi2/di-core/sources/inline-destructured.basic.transformed.snap.tsx?raw"
            )
          }
          title="🔄 Dependency Injection Transformation"
          originalFileName="inline-destructured.basic.input.tsx"
          transformedFileName="inline-destructured.basic.transformed.snap.tsx"
        />

        {/* Live Result */}
        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            backgroundColor: "#f8f9fa",
            borderRadius: "6px",
            border: "1px solid #dee2e6",
          }}
        >
          <h3 style={{ marginTop: 0, color: "#495057" }}>✨ Live Result</h3>
          <p style={{ color: "#6c757d", fontSize: "0.9rem" }}>
            The transformed code above produces this working React component:
          </p>
          <div
            style={{
              padding: "1rem",
              backgroundColor: "white",
              border: "1px solid #ced4da",
              borderRadius: "4px",
              textAlign: "center",
            }}
          >
            {/* <DIProvider container={container}>
              <InlineDestructured />
            </DIProvider> */}
          </div>
        </div>
      </div>
    </DIStory>
  );
};
