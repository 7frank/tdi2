// Auto-generated transformation snapshot for MissingDependencies
// Generated: 2025-08-23T23:14:14.970Z
import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface, NonExistentInterface, AnotherNonExistentInterface } from './shared-types';

export function MissingDependencies(props: {
  services: {
    existing: Inject<ApiInterface>;
    missingRequired: Inject<NonExistentInterface>;
    missingOptional?: InjectOptional<AnotherNonExistentInterface>;
  };
}) {
  const { services } = props;
  
  React.useEffect(() => {
    services.existing.getData();
    services.missingRequired.doSomething(); // This will cause runtime error
    services.missingOptional?.doSomethingElse(); // This should be undefined
  }, []);

  return <div>Component with missing dependencies</div>;
}
