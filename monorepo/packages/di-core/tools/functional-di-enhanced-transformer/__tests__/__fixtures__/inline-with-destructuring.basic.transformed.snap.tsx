// Auto-generated transformation snapshot for InlineWithDestructuring
// Generated: 2025-07-18T10:23:47.950Z
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
    const api = props.services?.api; if (!api) {throw new Error("Could not find implementation for 'ApiInterface'");}
    const logger = props.services?.logger;
    const { message } = props; if (!logger) {throw new Error("Could not find implementation for 'LoggerInterface'");}
    const cache = props.services?.cache; if (!cache) {throw new Error("Could not find implementation for 'CacheInterface<any>'");}
  React.useEffect(() => {
    api.getData().then((data) => {
      logger.log(`Got data: ${data.length} items`);
      cache.set("data", data);
    });
  }, []);

  return <div>Message: {message}</div>;
}
