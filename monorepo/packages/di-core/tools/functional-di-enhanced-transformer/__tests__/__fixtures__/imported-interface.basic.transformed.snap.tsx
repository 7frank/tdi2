// Auto-generated transformation snapshot for ImportedInterfaceComponent
// Generated: 2025-07-16T19:55:48.612Z
import React from 'react';
import type { ImportedComponentProps } from './ComponentInterfaces';
import { useService, useOptionalService } from "@tdi2/di-core/context";

export function ImportedInterfaceComponent(props: ImportedComponentProps) {
    const api = props.services?.api ?? (useService('ApiInterface') as unknown as ApiInterface);
    const logger = props.services?.logger ?? undefined;
    const { data } = props;
  return (
    <div>
      <p>Data count: {data.length}</p>
      <button onClick={() => {
        logger.log('Button clicked');
        api.refreshData();
      }}>
        Refresh
      </button>
    </div>
  );
}
