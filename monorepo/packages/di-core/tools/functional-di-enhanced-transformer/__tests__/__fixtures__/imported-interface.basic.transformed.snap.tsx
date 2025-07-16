// Auto-generated transformation snapshot for ImportedInterfaceComponent
// Generated: 2025-07-16T10:38:49.843Z
import React from 'react';
import type { ImportedComponentProps } from './ComponentInterfaces';
import { useService, useOptionalService } from "@tdi2/di-core/context";

export function ImportedInterfaceComponent(props: ImportedComponentProps) {
                const api = useService('ApiInterface') as unknown as ApiInterface;
                const logger = undefined; // Optional dependency not found
                const services = { api, logger };
  const { data } = props;
  
  return (
    <div>
      <p>Data count: {data.length}</p>
      <button onClick={() => {
        services.logger?.log('Button clicked');
        services.api.refreshData();
      }}>
        Refresh
      </button>
    </div>
  );
}
