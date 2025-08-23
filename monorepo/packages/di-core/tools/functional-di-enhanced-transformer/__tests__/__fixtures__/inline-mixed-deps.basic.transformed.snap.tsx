// Auto-generated transformation snapshot for InlineMixedDeps
// Generated: 2025-08-23T23:14:13.756Z
import React from "react";
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import {
  ApiInterface,
  LoggerService,
  CacheInterface,
  UserServiceInterface,
} from "./shared-types";

export function InlineMixedDeps(props: {
  config: any;
  api: Inject<ApiInterface>;
  services: {
    logger: LoggerService; // Non-DI service
    cache?: InjectOptional<CacheInterface<any>>;
    user: Inject<UserServiceInterface>;
  };
}) {
  const {
    config,
    services: { logger, user, cache },
    api,
  } = props;

  api.getData();
  logger.log("");
  user.processData([]);
  cache?.get("foo");

  return <div>Mixed dependencies component{config}</div>;
}
