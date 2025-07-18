// Auto-generated transformation snapshot for DeepDestructuring
// Generated: 2025-07-18T10:23:49.812Z
import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface, LoggerInterface } from './shared-types';
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
    const api = props.services?.api; if (!api) {throw new Error("Could not find implementation for 'ApiInterface'");}
    const { user: { profile: { settings: { theme, notifications } } }, config: { apiUrl, timeout } } = props;
    const logger = props.services?.logger; if (!logger) {throw new Error("Could not find implementation for 'LoggerInterface'");}
  React.useEffect(() => {
    logger.log(`Theme: ${theme}, Notifications: ${notifications}`);
    api.configure({ url: apiUrl, timeout });
  }, [theme, notifications, apiUrl, timeout]);
  
  return (
    <div data-theme={theme}>
      <p>API: {apiUrl} (timeout: {timeout}ms)</p>
      <p>Notifications: {notifications ? 'on' : 'off'}</p>
    </div>
  );
}
