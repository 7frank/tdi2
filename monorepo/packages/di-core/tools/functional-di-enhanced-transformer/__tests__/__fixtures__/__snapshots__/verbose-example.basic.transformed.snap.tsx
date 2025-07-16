// Auto-generated transformation snapshot for VerboseExampleComponent
// Generated: 2025-07-16T08:25:39.479Z
import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { useService, useOptionalService } from "@tdi2/di-core/context";

export function VerboseExampleComponent(props: {
  title: string;
  services: {
    api: Inject<ApiInterface>;
    logger?: InjectOptional<LoggerInterface>;
  };
}) {
                const api = useService('ApiInterface'); // Warning: implementation not found
                const logger = undefined; // Optional dependency not found
                const services = { api, logger };
  const { title } = props;
  
  React.useEffect(() => {
    services.logger?.log(`VerboseExample: ${title}`);
    services.api.getData().then(data => {
      services.logger?.log(`VerboseExample: Got ${data.length} items`);
    });
  }, [title]);

  return <div>Verbose Example: {title}</div>;
}
