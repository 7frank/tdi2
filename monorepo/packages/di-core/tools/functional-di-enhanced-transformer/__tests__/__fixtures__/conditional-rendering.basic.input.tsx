import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface, LoggerInterface } from './shared-types';

export function ConditionalRendering(props: {
  isEnabled: boolean;
  services: {
    api: Inject<ApiInterface>;
    logger?: InjectOptional<LoggerInterface>;
  };
}) {
  const { isEnabled, services } = props;
  
  if (!isEnabled) {
    return <div>Feature disabled</div>;
  }
  
  return (
    <div>
      {services.logger && (
        <button onClick={() => services.logger?.log('Button clicked')}>
          Log Click
        </button>
      )}
      <button onClick={() => services.api.getData()}>
        Load Data
      </button>
    </div>
  );
}
