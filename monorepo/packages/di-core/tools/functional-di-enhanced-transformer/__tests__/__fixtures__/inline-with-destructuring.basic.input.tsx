import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface, LoggerInterface, CacheInterface } from './shared-types';

export function InlineWithDestructuring(props: {
  message: string;
  services: {
    api: Inject<ApiInterface>;
    logger?: InjectOptional<LoggerInterface>;
    cache?: InjectOptional<CacheInterface<any>>;
  };
}) {
  const { message, services } = props;
  
  React.useEffect(() => {
    services.api.getData().then(data => {
      services.logger?.log(`Got data: ${data.length} items`);
      services.cache?.set('data', data);
    });
  }, []);

  return <div>Message: {message}</div>;
}
