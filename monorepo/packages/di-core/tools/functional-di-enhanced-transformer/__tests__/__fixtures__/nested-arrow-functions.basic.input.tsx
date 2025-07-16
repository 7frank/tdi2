import React from 'react';
import type { Inject } from "@tdi2/di-core/markers";

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
