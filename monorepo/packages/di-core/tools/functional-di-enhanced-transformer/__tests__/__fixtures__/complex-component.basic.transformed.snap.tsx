// Auto-generated transformation snapshot for ComplexComponent
// Generated: 2025-07-16T10:34:22.523Z
import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { useService, useOptionalService } from "@tdi2/di-core/context";

export function ComplexComponent(props: {
  userId: string;
  config: {
    theme: string;
    debug: boolean;
  };
  services: {
    api: Inject<ApiInterface>;
    logger: Inject<LoggerInterface>;
    cache?: InjectOptional<CacheInterface<any>>;
    user?: InjectOptional<UserServiceInterface>;
  };
}) {
                const api = useService('ApiInterface') as unknown as ApiInterface;
                const logger = useService('LoggerInterface') as unknown as LoggerInterface;
                const cache = undefined; // Optional dependency not found
                const user = undefined; // Optional dependency not found
                const services = { api, logger, cache, user };
  const { userId, config } = props;
  
  React.useEffect(() => {
    services.logger.log(`Loading complex component for user ${userId}`);
    
    services.api.getUserData(userId).then(data => {
      services.cache?.set(`user-${userId}`, data);
      services.user?.updateProfile(data);
      
      if (config.debug) {
        services.logger.log(`Debug: Loaded user data for ${userId}`);
      }
    });
  }, [userId, config.debug]);

  return (
    <div data-theme={config.theme}>
      <h1>Complex Component</h1>
      <p>User: {userId}</p>
      <p>Debug: {config.debug ? 'ON' : 'OFF'}</p>
    </div>
  );
}
