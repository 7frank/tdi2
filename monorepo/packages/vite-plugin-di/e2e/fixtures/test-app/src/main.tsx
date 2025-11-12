import React from "react";
import ReactDOM from "react-dom/client";
import { DIProvider } from "@tdi2/di-core/context";
import { CompileTimeDIContainer } from "@tdi2/di-core";
import { DI_CONFIG } from "./.tdi2/di-config";
import { App } from "./App";

// Initialize DI container
const container = new CompileTimeDIContainer();
container.loadConfiguration(DI_CONFIG);

// The App component will be transformed to handle DI automatically
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DIProvider container={container}>
      <App />
    </DIProvider>
  </React.StrictMode>
);
