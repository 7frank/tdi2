// Auto-generated transformation snapshot for DeepDestructuring
// Generated: 2025-07-16T09:59:52.481Z
import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { useService, useOptionalService } from "@tdi2/di-core/context";

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
                const api = useService('ApiInterface'); // Warning: implementation not found
                const logger = undefined; // Optional dependency not found
                const services = { api, logger };
  const { user: {
          profile: {
            settings: { theme, notifications }
          }
        }, config: { apiUrl, timeout } } = props;
  
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
