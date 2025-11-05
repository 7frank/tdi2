import React from "react";
import { createRoot } from "react-dom/client";
import { CompileTimeDIContainer } from "@tdi2/di-core";
import { DIProvider } from "@tdi2/di-core/context";
import App from "./App";


// Import styles
import "./styles/dashboard.css";

import { DI_CONFIG } from "./.tdi2/di-config";

console.log("DI Config:", Object.keys(DI_CONFIG));
console.log("DI Config:", Object.values(DI_CONFIG));

// Create and configure the DI container
const container = new CompileTimeDIContainer();
container.loadConfiguration(DI_CONFIG);

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <DIProvider container={container}>
      <App />
    </DIProvider>
  </React.StrictMode>
);
