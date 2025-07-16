import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";

export function DeepDestructuring(props: {
  user: {
    profile: {
      settings: {
        theme: string;
        notifications: boolean;
      };
    };
  };
  config: {
    apiUrl: string;
    timeout: number;
  };
  services: {
    api: Inject<ApiInterface>;
    logger?: InjectOptional<LoggerInterface>;
  };
}) {
  const {
    user: {
      profile: {
        settings: { theme, notifications }
      }
    },
    config: { apiUrl, timeout },
    services
  } = props;
  
  React.useEffect(() => {
    services.logger?.log(`Theme: ${theme}, Notifications: ${notifications}`);
    services.api.configure({ url: apiUrl, timeout });
  }, [theme, notifications, apiUrl, timeout]);
  
  return (
    <div data-theme={theme}>
      <p>API: {apiUrl} (timeout: {timeout}ms)</p>
      <p>Notifications: {notifications ? 'on' : 'off'}</p>
    </div>
  );
}
