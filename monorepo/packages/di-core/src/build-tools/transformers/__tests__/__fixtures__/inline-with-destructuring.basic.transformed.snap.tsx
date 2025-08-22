// Auto-generated transformation snapshot for InlineWithDestructuring
// Generated: 2025-08-17T07:30:55.990Z
import React from "react";
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface, LoggerInterface, CacheInterface } from "./shared-types";
import { useService, useOptionalService } from "@tdi2/di-core/context";

/**
 * TODO optinoal should still resolve not  "?? undefined" in transformed
 */
export function InlineWithDestructuring(props: {
  message: string;
  services: {
    api: Inject<ApiInterface>;
    logger?: InjectOptional<LoggerInterface>;
    cache?: InjectOptional<CacheInterface<any>>;
  };
}) {
    const api = props.services?.api ?? (useService('ApiInterface') as unknown as ApiInterface);
    const logger = props.services?.logger ?? (useOptionalService('LoggerInterface') as unknown as LoggerInterface);
    const cache = props.services?.cache ?? (useOptionalService('CacheInterface_any') as unknown as CacheInterface<any>);
    const { message } = props;
  React.useEffect(() => {
    api.getData().then((data) => {
      logger.log(`Got data: ${data.length} items`);
      cache.set("data", data);
    });
  }, []);

  return <div>Message: {message}</div>;
}
