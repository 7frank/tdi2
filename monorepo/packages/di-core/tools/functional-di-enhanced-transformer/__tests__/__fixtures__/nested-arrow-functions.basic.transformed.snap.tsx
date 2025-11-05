// Auto-generated transformation snapshot for NestedArrowFunctions
// Generated: 2025-08-24T22:03:36.975Z
import React from 'react';
import type { Inject } from "@tdi2/di-core/markers";
import { ApiInterface } from './shared-types';
import { useService, useOptionalService } from "@tdi2/di-core/context";

export const NestedArrowFunctions = (props: {
  services: {
    api: Inject<ApiInterface>;
  };
}) => {
    const api = props.services?.api ?? (useService('ApiInterface') as unknown as ApiInterface);
  const handleClick = React.useCallback(() => {
    const innerFunction = () => {
      props.services.api.getData();
    };
    return innerFunction;
  }, []);

  return <button onClick={handleClick()}>Click me</button>;
};
