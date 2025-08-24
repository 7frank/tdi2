// Auto-generated transformation snapshot for TodoApp2
// Generated: 2025-08-24T07:49:25.040Z
import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface, LoggerInterface, CacheInterface } from "./shared-types";
import { useService, useOptionalService } from "@tdi2/di-core/context";

interface AppProps {
  services: {
    api: Inject<ApiInterface>;
    logger: Inject<LoggerInterface>;
    cache: Inject<CacheInterface<string>>;
  };
}

// This is the EXACT problematic pattern from the backlog
export function TodoApp2(props: AppProps) {
    const api = props.services?.api ?? (useService('ApiInterface') as unknown as ApiInterface);
    const logger = props.services?.logger ?? (useService('LoggerInterface') as unknown as LoggerInterface);
    const cache = props.services?.cache ?? (useService('CacheInterface_string') as unknown as CacheInterface<string>);
  React.useEffect(() => {
    api.getData();
    logger.log('Component mounted');
  }, []);

  const handleClick = async () => {
    const data = await api.getData();
    cache.set('latest-data', JSON.stringify(data));
    logger.log('Data cached successfully');
  };

  return (
    <div>
      <h1>Destructured Services App</h1>
      <button onClick={handleClick}>
        Load and Cache Data
      </button>
    </div>
  );
}

// Additional test cases for comparison

interface SimpleProps {
  api: Inject<ApiInterface>;
}

// This pattern should work fine (non-destructured)
export function WorkingApp(props: SimpleProps) {
    const api = props.api ?? (useService('ApiInterface') as unknown as ApiInterface);
  const handleClick = async () => {
    const data = await api.getData();
    console.log('Data loaded:', data);
  };

  return (
    <div>
      <button onClick={handleClick}>
        Load Data
      </button>
    </div>
  );
}

interface ComplexProps {
  config: {
    theme: string;
    apiUrl: string;
  };
  services: {
    api: Inject<ApiInterface>;
    logger?: InjectOptional<LoggerInterface>;
  };
  metadata: {
    version: string;
  };
}

// Complex nested destructuring with services mixed in
export function ComplexDestructuredApp(props: ComplexProps) {
    const api = props.services?.api ?? (useService('ApiInterface') as unknown as ApiInterface);
    const logger = props.services?.logger ?? (useOptionalService('LoggerInterface') as unknown as LoggerInterface);
    const { config: { theme, apiUrl }, metadata: { version } } = props;
  const data = api.getUserData('123');
  logger?.log(`Loaded user data for version ${version}`);
  
  return (
    <div data-theme={theme}>
      <p>API: {apiUrl}</p>
      <p>Version: {version}</p>
      <p>User loaded</p>
    </div>
  );
}