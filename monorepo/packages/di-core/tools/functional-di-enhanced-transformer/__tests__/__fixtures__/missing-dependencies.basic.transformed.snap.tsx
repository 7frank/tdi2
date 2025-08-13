// Auto-generated transformation snapshot for MissingDependencies
// Generated: 2025-07-18T10:23:49.592Z
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
    const existing = props.services?.existing; if (!existing) {throw new Error("Could not find implementation for 'ApiInterface'");}
    const missingRequired = props.services?.missingRequired; if (!missingRequired) {throw new Error("Could not find implementation for 'NonExistentInterface'");}
    const missingOptional = props.services?.missingOptional; if (!missingOptional) {throw new Error("Could not find implementation for 'AnotherNonExistentInterface'");}
  React.useEffect(() => {
    existing.getData();
    missingRequired.doSomething(); // This will cause runtime error
    missingOptional.doSomethingElse(); // This should be undefined
  }, []);

  return <div>Component with missing dependencies</div>;
}
