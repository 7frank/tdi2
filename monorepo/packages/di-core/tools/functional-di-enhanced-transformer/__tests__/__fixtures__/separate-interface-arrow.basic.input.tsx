import React from 'react';
import type { SimpleComponentProps } from './separate-interface.interfaces';

export const SeparateInterfaceArrow = (props: SimpleComponentProps) => {
  const { title, services } = props;
  
  React.useEffect(() => {
    services.api.getData().then(data => {
      console.log(`Loaded data for ${title}:`, data);
    });
  }, [title]);
  
  return (
    <div>
      <h1>Title: {title}</h1>
      <button onClick={() => services.api.getData()}>
        Refresh Data
      </button>
    </div>
  );
};
