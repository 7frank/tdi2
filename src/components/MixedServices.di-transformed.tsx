/*
 * TDI2 Functional DI - Transformed File
 * =====================================
 * 
 * Original: ../../../../../../../../../src/components/MixedServices.tsx
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

export function MixedServices(props: {
  config: any;
  services: {
    api: Inject<ExampleApiInterface>; // DI
    logger: LoggerService; // Non-DI
    cache?: InjectOptional<CacheInterface<any>>; // DI optional
  };
}) {
                const api = useService('ExampleApiInterface');
                const cache = undefined; // Optional dependency not found
                const services = { api, cache };
  const { config } = props;
  return <div>Mixed services</div>;
}
  

/*
 * Transformation Analysis
 * =====================
 * 
 * DI Hooks Injected: 1
 * Services Resolved: 1
 * Import Statements Added: 1
 * Destructuring Patterns Modified: 1
 * 
 * Services Detected:
 * - api: ExampleApiInterface (useService)
 * 
 * Warnings:
 * - const cache = undefined; // Optional dependency not found
 */