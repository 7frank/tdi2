import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";

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
  const { userId, config, services } = props;
  
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
