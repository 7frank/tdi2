import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";

export function VerboseExampleComponent(props: {
  title: string;
  services: {
    api: Inject<ApiInterface>;
    logger?: InjectOptional<LoggerInterface>;
  };
}) {
  const { title, services } = props;
  
  React.useEffect(() => {
    services.logger?.log(`VerboseExample: ${title}`);
    services.api.getData().then(data => {
      services.logger?.log(`VerboseExample: Got ${data.length} items`);
    });
  }, [title]);

  return <div>Verbose Example: {title}</div>;
}
