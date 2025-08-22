// Auto-generated transformation snapshot for VerboseExampleComponent
// Generated: 2025-08-18T19:23:19.320Z
import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface, LoggerInterface } from './shared-types';
import { useService, useOptionalService } from "@tdi2/di-core/context";

export function VerboseExampleComponent(props: {
  title: string;
  services: {
    api: Inject<ApiInterface>;
    logger?: InjectOptional<LoggerInterface>;
  };
}) {
    const api = props.services?.api ?? (useService('ApiInterface') as unknown as ApiInterface);
    const logger = props.services?.logger ?? (useOptionalService('LoggerInterface') as unknown as LoggerInterface);
    const { title } = props;
  React.useEffect(() => {
    logger.log(`VerboseExample: ${title}`);
    api.getData().then(data => {
      logger.log(`VerboseExample: Got ${data.length} items`);
    });
  }, [title]);

  return <div>Verbose Example: {title}</div>;
}
