import React from 'react';
import type { Inject } from '@tdi2/di-core/markers';
import { ApiInterface } from './shared-types';

// This is the pattern used in plugin-core/fixtures/Counter.tsx
// Destructuring happens in the function body, not in parameters
export function SimpleComponent(props: {
  services: {
    api: Inject<ApiInterface>;
  };
}) {
  const { api } = props.services;

  return (
    <div>
      <button onClick={() => api.getData()}>Load Data</button>
    </div>
  );
}
