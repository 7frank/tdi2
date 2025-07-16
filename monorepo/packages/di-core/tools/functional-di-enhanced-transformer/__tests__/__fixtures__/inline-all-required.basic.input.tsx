import React from 'react';
import type { Inject } from "@tdi2/di-core/markers";

export function InlineAllRequired(props: {
  id: string;
  services: {
    api: Inject<ApiInterface>;
    logger: Inject<LoggerInterface>;
    user: Inject<UserServiceInterface>;
  };
}) {
  const { id, services } = props;
  
  React.useEffect(() => {
    services.logger.log(`Loading data for ${id}`);
    services.api.getData().then(data => {
      services.user.processData(data);
    });
  }, [id]);
  
  return <div>ID: {id}</div>;
}
