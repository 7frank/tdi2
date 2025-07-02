/*
 * TDI2 Functional DI - Transformed File
 * =====================================
 * 
 * Original: ../../../../../../../../../src/components/InlineWithoutDestructuring.tsx
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

export function InlineWithoutDestructuring(props: {
  title: string;
  services: {
    api: Inject<ExampleApiInterface>;
    cache?: InjectOptional<CacheInterface<any>>;
  };
}) {
                const api = useService('ExampleApiInterface');
                const cache = undefined; // Optional dependency not found
                const services = { api, cache };
  React.useEffect(() => {
    props.services.api.getData().then(data => {
      props.services.cache?.set('data', data);
    });
  }, []);

  return <div>Inline without destructuring: {props.title}</div>;
}
  

/*
 * Transformation Analysis
 * =====================
 * 
 * DI Hooks Injected: 1
 * Services Resolved: 1
 * Import Statements Added: 1
 * Destructuring Patterns Modified: 0
 * 
 * Services Detected:
 * - api: ExampleApiInterface (useService)
 * 
 * Warnings:
 * - const cache = undefined; // Optional dependency not found
 */