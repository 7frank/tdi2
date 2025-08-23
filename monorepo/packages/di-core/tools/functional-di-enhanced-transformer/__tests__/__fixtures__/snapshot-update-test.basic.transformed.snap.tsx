// Auto-generated transformation snapshot for SnapshotUpdateTest
// Generated: 2025-08-23T23:14:17.202Z
import React from 'react';
import type { Inject } from "@tdi2/di-core/markers";
import { ApiInterface } from './shared-types';

export function SnapshotUpdateTest(props: {
  message: string;
  services: {
    api: Inject<ApiInterface>;
  };
}) {
  const { message, services } = props;
  
  return (
    <div>
      <p>{message}</p>
      <button onClick={() => services.api.getData()}>
        Load Data
      </button>
    </div>
  );
}
