// Auto-generated transformation snapshot for InlineAllRequired
// Generated: 2025-07-16T10:05:57.594Z
import React from 'react';
import type { Inject } from "@tdi2/di-core/markers";
import { useService, useOptionalService } from "@tdi2/di-core/context";

export function InlineAllRequired(props: {
  id: string;
  services: {
    api: Inject<ApiInterface>;
    logger: Inject<LoggerInterface>;
    user: Inject<UserServiceInterface>;
  };
}) {
                const api = useService('ApiInterface') as unknown as ApiInterface;
                const logger = useService('LoggerInterface') as unknown as LoggerInterface;
                const user = useService('UserServiceInterface') as unknown as UserServiceInterface;
                const services = { api, logger, user };
  const { id } = props;
  
  React.useEffect(() => {
    services.logger.log(`Loading data for ${id}`);
    services.api.getData().then(data => {
      services.user.processData(data);
    });
  }, [id]);
  
  return <div>ID: {id}</div>;
}
