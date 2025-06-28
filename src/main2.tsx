// src/main.tsx - Complete integration example showing how to use the logging system

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { DIProvider, CompileTimeDIContainer } from './di/index.ts';
import { DI_CONFIG } from './.tdi2/di-config.ts';

// Import the new logging system
import { Logger, initLogging, log, errorLog } from './logging/index.ts';

// Initialize logging system FIRST
const logger = initLogging({
  environment: 'auto', // Auto-detect environment
  consoleLogLevel: process.env.NODE_ENV === 'production' ? 'WARN' : 'DEBUG',
  enableConsoleMonkeyPatch: true,
  serviceName: 'tdi2-react-app',
  serviceVersion: '1.0.0',
  customConfig: {
    resource: {
      'deployment.environment': process.env.NODE_ENV || 'development',
      'git.commit.sha': process.env.REACT_APP_GIT_SHA || 'unknown',
      'build.timestamp': new Date().toISOString()
    }
  }
});

// Log application startup
log.info('🚀 TDI2 Application Starting', {
  environment: process.env.NODE_ENV,
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  location: window.location.href
});

// Create and configure the DI container with logging
const container = new CompileTimeDIContainer();

// Enhanced debug logging for DI setup
Logger.withTiming('di-container-setup', () => {
  log.debug('🔧 Setting up DI container...');
  log.debug('📋 Available DI_CONFIG keys', { 
    configKeys: Object.keys(DI_CONFIG),
    configCount: Object.keys(DI_CONFIG).length
  });

  // Load the generated DI configuration
  container.loadConfiguration(DI_CONFIG);

  // Debug: Show registered services with enhanced logging
  const registeredTokens = container.getRegisteredTokens();
  log.info('✅ DI Container initialized', {
    registeredServiceCount: registeredTokens.length,
    services: registeredTokens.slice(0, 10), // Log first 10 services
    hasMoreServices: registeredTokens.length > 10
  });

  // Enhanced debug info with better formatting
  log.debugInfo('container-state', {
    totalServices: registeredTokens.length,
    serviceTypes: registeredTokens.reduce((acc, token) => {
      if (token.includes('Interface')) acc.interfaces++;
      else if (token.includes('Service')) acc.services++;
      else if (token.includes('Repository')) acc.repositories++;
      else acc.other++;
      return acc;
    }, { interfaces: 0, services: 0, repositories: 0, other: 0 })
  });

  // Test specific services that should be there with detailed logging
  const testServices = ['ApiService', 'UserService', 'ExampleApiInterface', 'LoggerInterface'];
  testServices.forEach(service => {
    const isRegistered = container.has(service);
    log.diResolution(service, isRegistered ? service : 'NOT_FOUND', isRegistered);
    
    if (!isRegistered) {
      log.warn(`❌ Expected service not found: ${service}`);
    }
  });
});

// Set up global error handlers with logging
window.addEventListener('error', (event) => {
  errorLog.diError('global_error', 'Uncaught JavaScript error', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  errorLog.diError('unhandled_rejection', 'Unhandled promise rejection', event.reason);
});

// Performance monitoring
const startTime = performance.now();

// React rendering with error boundary logging
const renderApp = () => {
  try {
    log.debug('🎨 Starting React app render');
    
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <DIProvider container={container}>
          <App />
        </DIProvider>
      </StrictMode>,
    );
    
    const renderTime = performance.now() - startTime;
    log.performance('app-initial-render', renderTime, 'ms');
    log.info('✅ React app rendered successfully', {
      renderTime: `${renderTime.toFixed(2)}ms`
    });
    
  } catch (error) {
    errorLog.diError('render_error', 'Failed to render React app', error as Error);
    throw error;
  }
};

// Enhanced container debugging with logging
const debugContainer = () => {
  if (process.env.NODE_ENV === 'development') {
    log.debugInfo('development-mode', {
      message: 'Development mode debugging enabled',
      availableDebugUrls: [
        'http://localhost:5173/_di_debug',
        'http://localhost:5173/_di_interfaces', 
        'http://localhost:5173/_di_configs'
      ]
    });
    
    // Log memory usage in development
    log.memoryUsage();
    
    // Try to access the debug container method if available
    try {
      if (typeof (container as any).debugContainer === 'function') {
        (container as any).debugContainer();
      }
    } catch (error) {
      log.debug('Debug container method not available or failed', { error: error.message });
    }
  }
};

// Application lifecycle logging
window.addEventListener('load', () => {
  const loadTime = performance.now() - startTime;
  log.performance('app-full-load', loadTime, 'ms');
  log.info('🎯 Application fully loaded', {
    totalLoadTime: `${loadTime.toFixed(2)}ms`
  });
});

window.addEventListener('beforeunload', async () => {
  log.info('👋 Application shutting down');
  try {
    await logger.forceFlush();
  } catch (error) {
    console.error('Error flushing logs on shutdown:', error);
  }
});

// Service worker registration with logging (if available)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        log.info('✅ Service Worker registered', {
          scope: registration.scope
        });
      })
      .catch((error) => {
        log.error('❌ Service Worker registration failed', error);
      });
  });
}

// Execute the application
try {
  debugContainer();
  renderApp();
} catch (error) {
  errorLog.diError('application_startup_failed', 'Critical error during application startup', error as Error);
  
  // Fallback error display
  document.getElementById('root')!.innerHTML = `
    <div style="padding: 20px; color: red; font-family: monospace;">
      <h1>Application Failed to Start</h1>
      <p>A critical error occurred during startup. Please check the console for details.</p>
      <details>
        <summary>Error Details</summary>
        <pre>${error}</pre>
      </details>
    </div>
  `;
}

// Export for debugging in development
if (process.env.NODE_ENV === 'development') {
  (window as any).TDI2Debug = {
    logger,
    container,
    log: Logger,
    examples: () => import('./logging/example-usage.ts').then(m => m.examples)
  };
  
  log.debug('🛠️ Development debugging tools available', {
    message: 'Access TDI2Debug from browser console',
    tools: ['logger', 'container', 'log', 'examples()']
  });
}