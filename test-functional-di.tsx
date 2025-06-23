// test-functional-di.tsx - Test functional DI patterns

import React from "react";
import { createRoot } from "react-dom/client";
import {
  DIProvider,
  CompileTimeDIContainer,
  useService,
  useOptionalService,
} from "./src/di/index";
import { DI_CONFIG } from "./src/generated/di-config";

import type { Inject, InjectOptional } from "./src/di/markers";
import type { ExampleApiInterface } from "./src/services/ExampleApiInterface";
import type { LoggerService } from "./src/services/ExampleApiService";
import { EXAMPLE_API_TOKEN } from "./src/services/ExampleApiInterface";

// 3. Future: Marker Interface Pattern (what the transformer would handle)
interface TestServices {
  api: Inject<ExampleApiInterface>;
  logger?: InjectOptional<LoggerService>;
}

// This is what developers would write:
function FutureComponent(props: {
  title: string;
  services: TestServices;
}): JSX.Element {
  const { title, services } = props;

  React.useEffect(() => {
    services.logger?.log(`Future Component Test: ${title}`);
    services.api.getData().then((data) => {
      console.log("Future component received data:", data);
    });
  }, []);

  return <div>Future Pattern: {title}</div>;
}

// This is what the transformer would generate:
const FutureComponentTransformed = ({ title }: { title: string }) => {
  const api = useService<ExampleApiInterface>(EXAMPLE_API_TOKEN);
  const logger = useOptionalService<LoggerService>(LOGGER_TOKEN);

  const services: TestServices = { api, logger };

  return FutureComponent({ title, services });
};


// Test App
function TestApp() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Functional DI Pattern Tests</h1>

      <div style={{ margin: "20px 0" }}>
        <h2>3. POC: Marker Interface Pattern</h2>
        <FutureComponentTransformed title="Future Transformed Component" />
      </div>
    </div>
  );
}

// Setup and render
console.log("🧪 Testing Functional DI Patterns...");

const container = new CompileTimeDIContainer();
container.loadConfiguration(DI_CONFIG);

console.log("✅ Container setup complete");
console.log("📋 Available services:", container.getRegisteredTokens());

// Only run if we're in a browser environment
if (typeof window !== "undefined" && document.getElementById("root")) {
  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <DIProvider container={container}>
        <TestApp />
      </DIProvider>
    </React.StrictMode>
  );
} else {
  console.log("💡 This test file demonstrates functional DI patterns");
  console.log("🎯 Patterns implemented:");
  console.log("  🔮 POC Marker Interface Pattern (needs transformer)");
}
