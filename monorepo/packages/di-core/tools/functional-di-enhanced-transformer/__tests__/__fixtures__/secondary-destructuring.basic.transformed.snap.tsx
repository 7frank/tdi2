// Auto-generated transformation snapshot for DemographicsForm
// Generated: 2025-08-24T07:34:35.672Z
import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface, LoggerInterface } from './shared-types';
import { useService, useOptionalService } from "@tdi2/di-core/context";

interface DemographicsFormProps {
  onComplete: (data: any) => void;
  services: {
    demographicsForm: Inject<ApiInterface>;
    logger?: InjectOptional<LoggerInterface>;
  };
}

// This is the EXACT problematic pattern from the backlog - secondary destructuring
export function DemographicsForm(props: DemographicsFormProps) {
    const demographicsForm = props.services?.demographicsForm ?? (useService('ApiInterface') as unknown as ApiInterface);
    const logger = props.services?.logger ?? (useOptionalService('LoggerInterface') as unknown as LoggerInterface);
    const { onComplete } = props;
  React.useEffect(() => {
    demographicsForm.getData().then(data => {
      onComplete(data);
    });
  }, []);
  
  return <div>Demographics Form</div>;
}

// Additional test case - triple destructuring
export function ComplexForm(props: {
  config: {
    theme: string;
    settings: {
      timeout: number;
    };
  };
  services: {
    api: Inject<ApiInterface>;
    logger?: InjectOptional<LoggerInterface>;
  };
  metadata: {
    version: string;
  };
}) {
    const api = props.services?.api ?? (useService('ApiInterface') as unknown as ApiInterface);
    const logger = props.services?.logger ?? (useOptionalService('LoggerInterface') as unknown as LoggerInterface);
    const { config, metadata } = props;
  const { settings } = config;
  const { timeout } = settings;
  
  React.useEffect(() => {
    logger?.log(`Version: ${metadata.version}, Theme: ${config.theme}, Timeout: ${timeout}`);
    api.getData();
  }, []);
  
  return <div data-theme={config.theme}>Complex Form</div>;
}