// src/main.tsx

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { DIProvider, CompileTimeDIContainer } from './di';
import { setupDIContainer } from './generated/di-config';

// Create and configure the DI container
const container = new CompileTimeDIContainer();

// Load the generated DI configuration
setupDIContainer(container);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DIProvider container={container}>
      <App />
    </DIProvider>
  </StrictMode>,
);