// Auto-generated transformation snapshot for InlineAllRequired
// Generated: 2025-07-16T08:25:37.314Z
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
                const api = useService('ApiInterface'); // Warning: implementation not found
                const logger = useService('LoggerInterface'); // Warning: implementation not found
                const user = useService('UserServiceInterface'); // Warning: implementation not found
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
