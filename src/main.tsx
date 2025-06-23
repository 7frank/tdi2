// src/main.tsx

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { DIProvider, CompileTimeDIContainer } from './di/index.ts';
import { DI_CONFIG } from './generated/di-config.ts';

// Create and configure the DI container
const container = new CompileTimeDIContainer();

// Load the generated DI configuration
console.log('🔧 Setting up DI container...');
container.loadConfiguration(DI_CONFIG);

// Debug: Show registered services
const registeredTokens = container.getRegisteredTokens();
console.log('✅ Registered services:', registeredTokens);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DIProvider container={container}>
      <App />
    </DIProvider>
  </StrictMode>,
);