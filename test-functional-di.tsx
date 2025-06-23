// test-functional-di.tsx - Test functional DI patterns

import React from 'react';
import { createRoot } from 'react-dom/client';
import { DIProvider, CompileTimeDIContainer } from './src/di/index';
import { DI_CONFIG } from './src/generated/di-config';
import { 
  withServices, 
  useInjectServices,
  createDIComponent,
  functionalDI 
} from './src/di/functional-utils';
import type { Inject, InjectOptional } from './src/di/markers';
import type { ExampleApiInterface } from './src/services/ExampleApiInterface';
import type { LoggerService } from './src/services/ExampleApiService';
import { EXAMPLE_API_TOKEN, LOGGER_TOKEN } from './src/services/ExampleApiInterface';

// 1. HOC Pattern Test
const TestComponent1 = withServices({
  api: EXAMPLE_API_TOKEN,
  logger: LOGGER_TOKEN
})(({ title, services }: { 
  title: string; 
  services: { api: ExampleApiInterface; logger: LoggerService } 
}) => {
  React.useEffect(() => {
    services.logger.log(`HOC Test: ${title}`);
    services.api.getData().then(data => {
      console.log('HOC received data:', data);
    });
  }, []);

  return <div>HOC Test: {title}</div>;
});

// 2. Manual Hook Pattern Test
function TestComponent2({ title }: { title: string }) {
  const services = useInjectServices({
    api: EXAMPLE_API_TOKEN,
    logger: LOGGER_TOKEN
  });

  React.useEffect(() => {
    services.logger.log(`Manual Hook Test: ${title}`);
    services.api.getUserInfo('test-user').then(user => {
      console.log('Manual hook received user:', user);
    });
  }, []);

  return <div>Manual Hook Test: {title}</div>;
}

// 3. Future: Marker Interface Pattern (what the transformer would handle)
interface TestServices {
  api: Inject<ExampleApiInterface>;
  logger?: InjectOptional<LoggerService>;
}

// This is what developers would write:
function FutureComponent(props: { 
  title: string; 
  services: TestServices 
}): JSX.Element {
  const { title, services } = props;

  React.useEffect(() => {
    services.logger?.log(`Future Component Test: ${title}`);
    services.api.getData().then(data => {
      console.log('Future component received data:', data);
    });
  }, []);

  return <div>Future Pattern: {title}</div>;
}

// This is what the transformer would generate:
const FutureComponentTransformed = ({ title }: { title: string }) => {
  const api = useService<ExampleApiInterface>(EXAMPLE_API_TOKEN);
  const logger = useOptionalService<LoggerService>(LOGGER_TOKEN);
  
  const services: TestServices = { api, logger };
  
  return FutureComponent({ title, services });
};

// 4. Experimental Decorator Pattern
const TestComponent4 = functionalDI({
  api: EXAMPLE_API_TOKEN,
  logger: LOGGER_TOKEN
})(({ title, services }: { 
  title: string; 
  services: { api: ExampleApiInterface; logger: LoggerService } 
}) => {
  React.useEffect(() => {
    services.logger.log(`Decorator Test: ${title}`);
  }, []);

  return <div>Decorator Test: {title}</div>;
});

// Test App
function TestApp() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Functional DI Pattern Tests</h1>
      
      <div style={{ margin: '20px 0' }}>
        <h2>1. HOC Pattern (withServices)</h2>
        <TestComponent1 title="Working HOC Pattern" />
      </div>

      <div style={{ margin: '20px 0' }}>
        <h2>2. Manual Hook Pattern</h2>
        <TestComponent2 title="Working Manual Hook" />
      </div>

      <div style={{ margin: '20px 0' }}>
        <h2>3. Future: Marker Interface Pattern</h2>
        <FutureComponentTransformed title="Future Transformed Component" />
      </div>

      <div style={{ margin: '20px 0' }}>
        <h2>4. Experimental: Decorator Pattern</h2>
        <TestComponent4 title="Experimental Decorator" />
      </div>
    </div>
  );
}

// Setup and render
console.log('🧪 Testing Functional DI Patterns...');

const container = new CompileTimeDIContainer();
container.loadConfiguration(DI_CONFIG);

console.log('✅ Container setup complete');
console.log('📋 Available services:', container.getRegisteredTokens());

// Only run if we're in a browser environment
if (typeof window !== 'undefined' && document.getElementById('root')) {
  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <DIProvider container={container}>
        <TestApp />
      </DIProvider>
    </React.StrictMode>
  );
} else {
  console.log('💡 This test file demonstrates functional DI patterns');
  console.log('🎯 Patterns implemented:');
  console.log('  ✅ HOC Pattern (withServices)');
  console.log('  ✅ Manual Hook Pattern (useInjectServices)');  
  console.log('  🔮 Future Marker Interface Pattern (needs transformer)');
  console.log('  🧪 Experimental Decorator Pattern (functionalDI)');
}