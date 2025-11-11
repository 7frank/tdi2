import React from 'react';
import ReactDOM from 'react-dom/client';
import { DI_CONFIG } from './.tdi2/di-config';
import { App } from './App';

// Initialize DI container
DI_CONFIG.init();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
