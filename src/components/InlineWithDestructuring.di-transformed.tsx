/*
 * TDI2 Functional DI - Transformed File
 * =====================================
 * 
 * Original: ../../../../../../../../../src/components/InlineWithDestructuring.tsx
 * Config: @tdi2/di-core-8cac4eb2
 * Generated: 2025-07-02T12:50:39.591Z
 * 
 * This file shows the result of functional DI transformation.
 * Do not edit manually - regenerate using 'npm run di:enhanced'
 * 
 * Transformations applied:
 * - Interface-based dependency resolution
 * - DI hook injection
 * - Services object creation
 * - Destructuring pattern updates
 */


import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { useService, useOptionalService } from "@tdi2/di-core/context";

export function InlineWithDestructuring(props: {
  message: string;
  services: {
    api: Inject<ExampleApiInterface>;
    logger?: InjectOptional<LoggerInterface>;
  };
}) {
                const api = useService('ExampleApiInterface');
                const logger = useOptionalService('LoggerInterface');
                const services = { api, logger };
  const { message } = props;
  
  React.useEffect(() => {
    services.api.getData().then(data => {
      services.logger?.log(`Got data: ${data.length} items`);
    });
  }, []);

  return <div>Inline with destructuring: {message}</div>;
}
  

/*
 * Transformation Analysis
 * =====================
 * 
 * DI Hooks Injected: 2
 * Services Resolved: 2
 * Import Statements Added: 1
 * Destructuring Patterns Modified: 1
 * 
 * Services Detected:
 * - api: ExampleApiInterface (useService)
 * - logger: LoggerInterface (useOptionalService)
 * 
 * Warnings:

 */