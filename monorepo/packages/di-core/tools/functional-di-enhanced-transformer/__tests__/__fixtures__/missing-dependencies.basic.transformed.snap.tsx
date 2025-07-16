// Auto-generated transformation snapshot for MissingDependencies
// Generated: 2025-07-16T19:55:49.026Z
import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface, NonExistentInterface, AnotherNonExistentInterface } from './shared-types';
import { useService, useOptionalService } from "@tdi2/di-core/context";

export function MissingDependencies(props: {
  services: {
    existing: Inject<ApiInterface>;
    missingRequired: Inject<NonExistentInterface>;
    missingOptional?: InjectOptional<AnotherNonExistentInterface>;
  };
}) {
    const existing = props.services?.existing ?? (useService('ApiInterface') as unknown as ApiInterface);
    const missingRequired = props.services?.missingRequired ?? (useService('NonExistentInterface') as unknown as NonExistentInterface);
    const missingOptional = props.services?.missingOptional ?? undefined;
  React.useEffect(() => {
    existing.getData();
    missingRequired.doSomething(); // This will cause runtime error
    missingOptional.doSomethingElse(); // This should be undefined
  }, []);

  return <div>Component with missing dependencies</div>;
}
