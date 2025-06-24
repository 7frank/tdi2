// src/main.tsx - Updated to use bridge files

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { DIProvider, CompileTimeDIContainer } from './di/index.ts';
// Import from bridge file instead of generated directory
import { DI_CONFIG } from './.tdi2/di-config';

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