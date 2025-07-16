// Auto-generated transformation snapshot for InlineMixedDeps
// Generated: 2025-07-16T19:55:48.086Z
import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface, LoggerService, CacheInterface, UserServiceInterface } from './shared-types';
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
    const api = props.services?.api ?? (useService('ApiInterface') as unknown as ApiInterface);
    const cache = props.services?.cache ?? undefined;
    const user = props.services?.user ?? (useService('UserServiceInterface') as unknown as UserServiceInterface);
    const { config } = props;
  return <div>Mixed dependencies component</div>;
}
