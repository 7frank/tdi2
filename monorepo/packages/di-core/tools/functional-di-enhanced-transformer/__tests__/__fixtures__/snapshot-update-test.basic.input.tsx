import React from 'react';
import type { Inject } from "@tdi2/di-core/markers";

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
