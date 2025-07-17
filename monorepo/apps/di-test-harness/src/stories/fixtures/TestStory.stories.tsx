import type { Story } from "@ladle/react";
import { CompileTimeDIContainer } from "@tdi2/di-core/container";
import { DIProvider } from "@tdi2/di-core/context";
import { DI_CONFIG } from "../../.tdi2/di-config";
import { lazy } from "../../utils/simpleLazy";
import { DIStory } from "../../utils/DIStory";

// Import compiled component (no .js extension needed)
// const InlineDestructured = lazy(
//   () => import("@tdi2/di-core/examples/inline-destructured.basic.transformed.snap"),
//   "InlineDestructured"
// );

function InlineDestructured(){return <></>}

// Import original source code for display
import originalSource from "@tdi2/di-core/sources/inline-destructured.basic.input.tsx?raw";

// Import transformed source for comparison
import transformedSource from "@tdi2/di-core/sources/inline-destructured.basic.transformed.snap.tsx?raw";

// Source display component
const SourceDisplay = ({ 
  title, 
  source, 
  language = "typescript" 
}: { 
  title: string; 
  source: string; 
  language?: string; 
}) => (
  <div style={{ 
    padding: "1rem", 
    backgroundColor: "#f8f9fa", 
    borderRadius: "6px",
    border: "1px solid #dee2e6",
    marginBottom: "1rem"
  }}>
    <h4 style={{ marginTop: 0, color: "#495057" }}>{title}</h4>
    <pre style={{ 
      overflow: "auto", 
      fontSize: "0.8rem", 
      backgroundColor: "#ffffff", 
      padding: "1rem", 
      borderRadius: "4px",
      border: "1px solid #ced4da",
      maxHeight: "300px"
    }}>
      <code className={`language-${language}`}>{source}</code>
    </pre>
  </div>
);

// Create and configure the DI container
const container = new CompileTimeDIContainer();
container.loadConfiguration(DI_CONFIG);

export const AInlineDestructuredExample: Story = () => {
  return (
    <DIStory name="Inline Destructured Complete">
      <div style={{ padding: "1rem" }}>
        
        {/* Running Component */}
        <div style={{ 
          padding: "1.5rem", 
          backgroundColor: "#d4edda", 
          borderRadius: "8px",
          border: "1px solid #c3e6cb",
          marginBottom: "2rem",
          textAlign: "center"
        }}>
          <h2 style={{ marginTop: 0, color: "#155724" }}>
            🎯 Live Transformed Component
          </h2>
          <DIProvider container={container}>
            <InlineDestructured />
          </DIProvider>
        </div>

        {/* Source Code Display */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <SourceDisplay 
            title="📄 Original Source (Input)"
            source={originalSource}
          />
          <SourceDisplay 
            title="⚡ Transformed Source (Output)"
            source={transformedSource}
          />
        </div>
      </div>
    </DIStory>
  );
};

export const ABeforeAfterComparison: Story = () => {
  return (
    <DIStory name="Before/After Transformation">
      <div style={{ padding: "1rem" }}>
        
        <div style={{ 
          padding: "1rem", 
          backgroundColor: "#e3f2fd", 
          borderRadius: "6px",
          border: "1px solid #90caf9",
          marginBottom: "1rem",
          textAlign: "center"
        }}>
          <h3 style={{ marginTop: 0, color: "#1565c0" }}>
            🔄 DI Transformation Process
          </h3>
          <p style={{ color: "#1565c0", margin: "0.5rem 0" }}>
            Watch how dependency injection transforms your components
          </p>
        </div>

        {/* Before */}
        <SourceDisplay 
          title="🔴 BEFORE: Component with Inject<T> dependencies"
          source={originalSource}
        />
        
        {/* Arrow */}
        <div style={{ textAlign: "center", margin: "1rem 0" }}>
          <div style={{ 
            fontSize: "2rem", 
            color: "#28a745",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem"
          }}>
            ⬇️ <span style={{ fontSize: "1rem" }}>DI Transformer</span> ⬇️
          </div>
        </div>

        {/* After */}
        <SourceDisplay 
          title="🟢 AFTER: Component with useService() hooks"
          source={transformedSource}
        />

        {/* Result */}
        <div style={{ 
          padding: "1rem", 
          backgroundColor: "#d4edda", 
          borderRadius: "6px",
          border: "1px solid #c3e6cb",
          marginTop: "1rem",
          textAlign: "center"
        }}>
          <h4 style={{ marginTop: 0, color: "#155724" }}>
            ✅ Final Result
          </h4>
          <DIProvider container={container}>
            <InlineDestructured />
          </DIProvider>
        </div>
      </div>
    </DIStory>
  );
};

export const AMultipleExamples: Story = () => {
  // You can add more examples here once the package exports are updated
  const examples = [
    {
      name: "inline-destructured",
      title: "Inline Destructured Props",
      component: InlineDestructured
    }
    // Add more examples:
    // {
    //   name: "inline-all-required", 
    //   title: "All Required Dependencies",
    //   component: lazy(() => import("@tdi2/di-core/examples/inline-all-required.basic.transformed.snap"), "Component")
    // }
  ];

  return (
    <DIStory name="Multiple Examples">
      <div style={{ padding: "1rem" }}>
        <h2 style={{ textAlign: "center", color: "#333", marginBottom: "2rem" }}>
          📚 DI Transformation Examples
        </h2>
        
        {examples.map((example, index) => (
          <div key={example.name} style={{ 
            marginBottom: "2rem",
            padding: "1rem",
            border: "1px solid #ddd",
            borderRadius: "8px"
          }}>
            <h3 style={{ color: "#495057" }}>
              {index + 1}. {example.title}
            </h3>
            <DIProvider container={container}>
              <example.component />
            </DIProvider>
          </div>
        ))}
      </div>
    </DIStory>
  );
};