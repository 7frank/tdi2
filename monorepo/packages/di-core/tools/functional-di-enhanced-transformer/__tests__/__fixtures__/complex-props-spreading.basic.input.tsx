import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface, LoggerInterface } from './shared-types';

interface BaseProps {
  id: string;
  className?: string;
}

export function ComplexPropsSpreading(props: BaseProps & {
  services: {
    api: Inject<ApiInterface>;
    logger?: InjectOptional<LoggerInterface>;
  };
  onClick?: () => void;
}) {
  const { id, className, services, onClick, ...restProps } = props;
  
  return (
    <div 
      className={className} 
      onClick={onClick}
      {...restProps}
    >
      {id}
    </div>
  );
}
