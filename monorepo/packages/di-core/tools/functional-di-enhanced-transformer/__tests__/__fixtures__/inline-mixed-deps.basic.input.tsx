import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface, LoggerService, CacheInterface, UserServiceInterface } from './shared-types';

export function InlineMixedDeps(props: {
  config: any;
  services: {
    api: Inject<ApiInterface>;
    logger: LoggerService; // Non-DI service
    cache?: InjectOptional<CacheInterface<any>>;
    user: Inject<UserServiceInterface>;
  };
}) {
  const { config, services } = props;
  
  return <div>Mixed dependencies component</div>;
}
