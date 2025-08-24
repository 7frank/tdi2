import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface, LoggerInterface } from './shared-types';

interface DemographicsFormProps {
  onComplete: (data: any) => void;
  services: {
    demographicsForm: Inject<ApiInterface>;
    logger?: InjectOptional<LoggerInterface>;
  };
}

// This is the EXACT problematic pattern from the backlog - secondary destructuring
export function DemographicsForm(props: DemographicsFormProps) {
  const { services, onComplete } = props;
  const { demographicsForm } = services;
  
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
  const { config, services, metadata } = props;
  const { api, logger } = services;
  const { settings } = config;
  const { timeout } = settings;
  
  React.useEffect(() => {
    logger?.log(`Version: ${metadata.version}, Theme: ${config.theme}, Timeout: ${timeout}`);
    api.getData();
  }, []);
  
  return <div data-theme={config.theme}>Complex Form</div>;
}