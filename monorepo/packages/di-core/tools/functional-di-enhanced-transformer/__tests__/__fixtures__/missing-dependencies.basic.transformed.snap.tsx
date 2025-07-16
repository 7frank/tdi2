// Auto-generated transformation snapshot for MissingDependencies
// Generated: 2025-07-16T10:29:09.912Z
import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { useService, useOptionalService } from "@tdi2/di-core/context";

export function MissingDependencies(props: {
  services: {
    existing: Inject<ApiInterface>;
    missingRequired: Inject<NonExistentInterface>;
    missingOptional?: InjectOptional<AnotherNonExistentInterface>;
  };
}) {
                const existing = useService('ApiInterface') as unknown as ApiInterface;
                const missingRequired = useService('NonExistentInterface') as unknown as NonExistentInterface;
                const missingOptional = undefined; // Optional dependency not found
                const services = { existing, missingRequired, missingOptional };
  React.useEffect(() => {
    services.existing.getData();
    services.missingRequired.doSomething(); // This will cause runtime error
    services.missingOptional?.doSomethingElse(); // This should be undefined
  }, []);

  return <div>Component with missing dependencies</div>;
}
