// Auto-generated transformation snapshot for InlineMixedDeps
// Generated: 2025-07-18T10:23:48.601Z
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
    const api = props.api; if (!api) {throw new Error("Could not find implementation for 'ApiInterface'");}
    const cache = props.services?.cache;
    const { config } = props; if (!cache) {throw new Error("Could not find implementation for 'CacheInterface<any>'");}
    const user = props.services?.user; if (!user) {throw new Error("Could not find implementation for 'UserServiceInterface'");}
  api.getData();
  logger.log("");
  user.processData([]);
  cache?.get("foo");

  return <div>Mixed dependencies component{config}</div>;
}
