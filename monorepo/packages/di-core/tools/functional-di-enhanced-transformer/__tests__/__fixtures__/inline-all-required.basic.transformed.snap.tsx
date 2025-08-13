// Auto-generated transformation snapshot for InlineAllRequired
// Generated: 2025-07-18T10:23:48.359Z
import React from 'react';
import type { Inject } from "@tdi2/di-core/markers";
import { ApiInterface, LoggerInterface, UserServiceInterface } from './shared-types';
import { useService, useOptionalService } from "@tdi2/di-core/context";

export function InlineAllRequired(props: {
  id: string;
  services: {
    api: Inject<ApiInterface>;
    logger: Inject<LoggerInterface>;
    user: Inject<UserServiceInterface>;
  };
}) {
    const api = props.services?.api; if (!api) {throw new Error("Could not find implementation for 'ApiInterface'");}
    const logger = props.services?.logger;
    const { id } = props; if (!logger) {throw new Error("Could not find implementation for 'LoggerInterface'");}
    const user = props.services?.user; if (!user) {throw new Error("Could not find implementation for 'UserServiceInterface'");}
  React.useEffect(() => {
    logger.log(`Loading data for ${id}`);
    api.getData().then(data => {
      user.processData(data);
    });
  }, [id]);
  
  return <div>ID: {id}</div>;
}
