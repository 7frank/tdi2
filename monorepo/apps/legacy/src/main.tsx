// src/main.tsx - Updated to use @tdi2/logging package

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { CompileTimeDIContainer } from "@tdi2/di-core/container";
import { DIProvider } from "@tdi2/di-core/context";
// Import from bridge file instead of generated directory
import { DI_CONFIG } from "./.tdi2/di-config";

// UPDATED: Import from @tdi2/logging package instead of local logging
import { initLogging } from "@tdi2/logging";

initLogging({
  consoleMonkeyPatch: {
    log: "console",
    debug: "console",
    info: "console",
    warn: "console",
    error: "console",
    table: "console",
  },
});

// Create and configure the DI container
const container = new CompileTimeDIContainer();

// Enhanced debug logging
console.log("🔧 Setting up DI container...");
console.log("📋 Available DI_CONFIG:", Object.keys(DI_CONFIG));

// Load the generated DI configuration
container.loadConfiguration(DI_CONFIG);

// Debug: Show registered services
const registeredTokens = container.getRegisteredTokens();
console.log("✅ Registered services:", registeredTokens);

// Enhanced debug info
console.log("🔍 Detailed container state:");
(container as any).debugContainer();

// Test specific services that should be there
const testServices = [
  "ApiService",
  "UserService",
  "ExampleApiInterface",
  "LoggerInterface",
];
testServices.forEach((service) => {
  const isRegistered = container.has(service);
  console.log(
    `🔍 ${service}: ${isRegistered ? "✅ Registered" : "❌ Not found"}`
  );
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DIProvider container={container}>
      <App />
    </DIProvider>
  </StrictMode>
);



