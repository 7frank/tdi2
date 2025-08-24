// Auto-generated transformation snapshot for InlineAllRequired
// Generated: 2025-08-17T08:19:51.051Z
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
    const api = props.services?.api ?? (useService('ApiInterface') as unknown as ApiInterface);
    const logger = props.services?.logger ?? (useService('LoggerInterface') as unknown as LoggerInterface);
    const user = props.services?.user ?? (useService('UserServiceInterface') as unknown as UserServiceInterface);
    const { id } = props;
  React.useEffect(() => {
    logger.log(`Loading data for ${id}`);
    api.getData().then(data => {
      user.processData(data);
    });
  }, [id]);
  
  return <div>ID: {id}</div>;
}
