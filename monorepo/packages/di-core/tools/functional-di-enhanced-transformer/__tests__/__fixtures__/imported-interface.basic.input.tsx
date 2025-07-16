import React from 'react';
import type { ImportedComponentProps } from './ComponentInterfaces';

export function ImportedInterfaceComponent(props: ImportedComponentProps) {
  const { data, services } = props;
  
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
