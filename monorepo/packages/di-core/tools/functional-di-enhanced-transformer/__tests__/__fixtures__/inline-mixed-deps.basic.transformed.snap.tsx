// Auto-generated transformation snapshot for InlineMixedDeps
// Generated: 2025-07-16T09:59:52.375Z
import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { useService, useOptionalService } from "@tdi2/di-core/context";

export function InlineMixedDeps(props: {
  config: any;
  services: {
    api: Inject<ApiInterface>;
    logger: LoggerService; // Non-DI service
    cache?: InjectOptional<CacheInterface<any>>;
    user: Inject<UserServiceInterface>;
  };
}) {
                const api = useService('ApiInterface'); // Warning: implementation not found
                const cache = undefined; // Optional dependency not found
                const user = useService('UserServiceInterface'); // Warning: implementation not found
                const services = { api, cache, user };
  const { config } = props;
  
  return <div>Mixed dependencies component</div>;
}
