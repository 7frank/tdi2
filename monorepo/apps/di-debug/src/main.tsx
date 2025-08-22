import React from "react";
import { createRoot } from "react-dom/client";
import { CompileTimeDIContainer } from "@tdi2/di-core";
import { DIProvider } from "@tdi2/di-core/context";
import App from "./App";

// Import service implementations to register them
import "./services/implementations/DashboardService";
import "./services/implementations/AnalyticsService";
import "./services/implementations/GraphService";
import "./services/implementations/WebSocketService";
import "./services/implementations/NotificationService";
import "./services/implementations/ConfigService";

// Import styles
import "./styles/dashboard.css";

import { DI_CONFIG } from "./.tdi2/di-config";

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
