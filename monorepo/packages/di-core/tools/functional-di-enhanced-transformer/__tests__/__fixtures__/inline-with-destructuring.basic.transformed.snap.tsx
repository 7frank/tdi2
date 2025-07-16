// Auto-generated transformation snapshot for InlineWithDestructuring
// Generated: 2025-07-16T10:05:57.563Z
import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { useService, useOptionalService } from "@tdi2/di-core/context";

export function InlineWithDestructuring(props: {
  message: string;
  services: {
    api: Inject<ApiInterface>;
    logger?: InjectOptional<LoggerInterface>;
    cache?: InjectOptional<CacheInterface<any>>;
  };
}) {
                const api = useService('ApiInterface') as unknown as ApiInterface;
                const logger = undefined; // Optional dependency not found
                const cache = undefined; // Optional dependency not found
                const services = { api, logger, cache };
  const { message } = props;
  
  React.useEffect(() => {
    services.api.getData().then(data => {
      services.logger?.log(`Got data: ${data.length} items`);
      services.cache?.set('data', data);
    });
  }, []);

  return <div>Message: {message}</div>;
}
