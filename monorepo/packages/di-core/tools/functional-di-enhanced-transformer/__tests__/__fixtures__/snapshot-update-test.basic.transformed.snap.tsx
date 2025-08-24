// Auto-generated transformation snapshot for SnapshotUpdateTest
// Generated: 2025-08-18T19:23:18.488Z
import React from 'react';
import type { Inject } from "@tdi2/di-core/markers";
import { ApiInterface } from './shared-types';
import { useService, useOptionalService } from "@tdi2/di-core/context";

export function SnapshotUpdateTest(props: {
  message: string;
  services: {
    api: Inject<ApiInterface>;
  };
}) {
    const api = props.services?.api ?? (useService('ApiInterface') as unknown as ApiInterface);
    const { message } = props;
  return (
    <div>
      <p>{message}</p>
      <button onClick={() => api.getData()}>
        Load Data
      </button>
    </div>
  );
}
