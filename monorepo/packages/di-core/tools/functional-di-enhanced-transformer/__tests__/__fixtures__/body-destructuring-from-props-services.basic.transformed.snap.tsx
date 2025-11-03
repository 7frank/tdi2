// Auto-generated transformation snapshot for SimpleComponent
// Generated: 2025-11-03T07:21:52.657Z
import React from 'react';
import type { Inject } from '@tdi2/di-core/markers';
import { ApiInterface } from './shared-types';
import { useService, useOptionalService } from "@tdi2/di-core/context";

// This is the pattern used in plugin-core/fixtures/Counter.tsx
// Destructuring happens in the function body, not in parameters
export function SimpleComponent(props: {
  services: {
    api: Inject<ApiInterface>;
  };
}) {
    const api = props.services?.api ?? (useService('ApiInterface') as unknown as ApiInterface);

  return (
    <div>
      <button onClick={() => api.getData()}>Load Data</button>
    </div>
  );
}
