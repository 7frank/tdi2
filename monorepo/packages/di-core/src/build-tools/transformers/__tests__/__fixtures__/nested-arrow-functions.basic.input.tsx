import React from 'react';
import type { Inject } from "@tdi2/di-core/markers";
import { ApiInterface } from './shared-types';

export const NestedArrowFunctions = (props: {
  services: {
    api: Inject<ApiInterface>;
  };
}) => {
  const handleClick = React.useCallback(() => {
    const innerFunction = () => {
      props.services.api.getData();
    };
    return innerFunction;
  }, []);

  return <button onClick={handleClick()}>Click me</button>;
};
