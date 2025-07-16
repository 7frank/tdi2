// Auto-generated transformation snapshot for SnapshotUpdateTest
// Generated: 2025-07-16T08:25:38.758Z
import React from 'react';
import type { Inject } from "@tdi2/di-core/markers";
import { useService, useOptionalService } from "@tdi2/di-core/context";

export function SnapshotUpdateTest(props: {
  message: string;
  services: {
    api: Inject<ApiInterface>;
  };
}) {
                const api = useService('ApiInterface'); // Warning: implementation not found
                const services = { api };
  const { message } = props;
  
  return (
    <div>
      <p>{message}</p>
      <button onClick={() => services.api.getData()}>
        Load Data
      </button>
    </div>
  );
}
