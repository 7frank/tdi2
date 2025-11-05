// Auto-generated transformation snapshot for InlineMixedDeps
// Generated: 2025-08-17T08:21:24.614Z
import React from "react";
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import {
  ApiInterface,
  LoggerService,
  CacheInterface,
  UserServiceInterface,
} from "./shared-types";
import { useService, useOptionalService } from "@tdi2/di-core/context";

export function InlineMixedDeps(props: {
  config: any;
  api: Inject<ApiInterface>;
  services: {
    logger: LoggerService; // Non-DI service
    cache?: InjectOptional<CacheInterface<any>>;
    user: Inject<UserServiceInterface>;
  };
}) {
    const api = props.api ?? (useService('ApiInterface') as unknown as ApiInterface);
    const cache = props.services?.cache ?? (useOptionalService('CacheInterface_any') as unknown as CacheInterface<any>);
    const user = props.services?.user ?? (useService('UserServiceInterface') as unknown as UserServiceInterface);
    const { config } = props;
  api.getData();
  logger.log("");
  user.processData([]);
  cache?.get("foo");

  return <div>Mixed dependencies component{config}</div>;
}
