// src/main.tsx - Minimal changes to add logging

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { CompileTimeDIContainer } from "@tdi2/di-core/container";
import { DIProvider } from "@tdi2/di-core/context";
// Import from bridge file instead of generated directory
import { DI_CONFIG } from "./.tdi2/di-config";

// ADDED: Import and initialize logging with fine-grained console control
import { initLogging } from "./logging";

initLogging({
  consoleMonkeyPatch: {
    log: "console", // console.log() goes only to OpenTelemetry
    debug: "console", // console.debug() goes only to OpenTelemetry
    info: "console", // console.info() goes only to OpenTelemetry
    warn: "console", // console.warn() goes to both OpenTelemetry and browser console
    error: "console", // console.error() goes to both OpenTelemetry and browser console
    table: "console", // console.table() goes only to OpenTelemetry
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
