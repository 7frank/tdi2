import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ServiceContainer, type ProviderWithScope } from "@deepkit/injector";
import { CounterService } from "./services/CounterService";
import App from "./App.tsx";

const providers: ProviderWithScope[] = [{ provide: CounterService }];

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ServiceContainer providers={providers}>
      <App />
    </ServiceContainer>
  </StrictMode>
);
