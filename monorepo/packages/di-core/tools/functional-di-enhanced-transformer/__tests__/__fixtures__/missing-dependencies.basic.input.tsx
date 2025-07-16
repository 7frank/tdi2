import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";

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
