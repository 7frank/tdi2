// src/components/DITransformationDemo.tsx
import React from 'react';
import { CompileTimeDIContainer } from "@tdi2/di-core/container";
import { DIProvider } from "@tdi2/di-core/context";
import { DI_CONFIG } from "../.tdi2/di-config";
import { DIStory } from "../utils/DIStory";
import { DiffViewWithControls } from "./DiffView";

interface DITransformationDemoProps {
  /**
   * Async import for source/original file
   */
  sourceImport: () => Promise<any>;
  
  /**
   * Async import for destination/transformed file  
   */
  destImport: () => Promise<any>;
  
  /**
   * Lazy component that represents the transformed component
   */
  transformedComponent: React.LazyExoticComponent<React.ComponentType<any>>;
  
  /**
   * Optional title for the demo
   */
  title?: string;
  
  /**
   * Original filename for display
   */
  originalFileName?: string;
  
  /**
   * Transformed filename for display
   */
  transformedFileName?: string;
}

// Create and configure the DI container (shared instance)
const container = new CompileTimeDIContainer();
container.loadConfiguration(DI_CONFIG);

export function DITransformationDemo({
  sourceImport,
  destImport,
  transformedComponent: TransformedComponent,
  title = "Interactive Code Transformation Analysis",
  originalFileName = "original.tsx",
  transformedFileName = "transformed.tsx"
}: DITransformationDemoProps) {
  return (
    <>
      {/* Header Section */}
      <div style={{
        padding: "1rem",
        backgroundColor: "#e3f2fd",
        borderRadius: "6px",
        border: "1px solid #90caf9",
        marginBottom: "2rem",
      }}>
        <h2 style={{ marginTop: 0, color: "#1565c0" }}>
          🔍 {title}
        </h2>
        <p style={{ color: "#1565c0", margin: "0.5rem 0" }}>
          Use the controls below to customize the diff view and explore how
          the DI transformer changes your code.
        </p>
      </div>

      {/* Diff View */}
      <DiffViewWithControls
        src={sourceImport}
        dest={destImport}
        title="🔄 Dependency Injection Transformation"
        originalFileName={originalFileName}
        transformedFileName={transformedFileName}
      />

      {/* Live Result Section */}
      <div style={{
        marginTop: "2rem",
        padding: "1rem",
        backgroundColor: "#f8f9fa",
        borderRadius: "6px",
        border: "1px solid #dee2e6",
      }}>
        <h3 style={{ marginTop: 0, color: "#495057" }}>
          ✨ Live Result
        </h3>
        <p style={{ color: "#6c757d", fontSize: "0.9rem", margin: "0.5rem 0" }}>
          The transformed code above produces this working React component:
        </p>
        <div style={{
          padding: "1rem",
          backgroundColor: "white",
          border: "1px solid #ced4da",
          borderRadius: "4px",
          textAlign: "center",
        }}>
          <DIStory name="Transformation Demo">
            <DIProvider container={container}>
              <TransformedComponent />
            </DIProvider>
          </DIStory>
        </div>
      </div>
    </>
  );
}