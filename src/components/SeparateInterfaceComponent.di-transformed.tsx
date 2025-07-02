/*
 * TDI2 Functional DI - Transformed File
 * =====================================
 * 
 * Original: ../../../../../../../../../src/components/SeparateInterfaceComponent.tsx
 * Config: @tdi2/di-core-8cac4eb2
 * Generated: 2025-07-02T12:50:39.592Z
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
import type { SimpleComponentProps } from './ComponentInterfaces';
import { useService, useOptionalService } from "@tdi2/di-core/context";

export function SeparateInterfaceComponent(props: SimpleComponentProps) {
                const api = useService('ExampleApiInterface');
                const services = { api };
  const { title } = props;
  
  React.useEffect(() => {
    services.api.getData();
  }, []);

  return <div>Separate interface: {title}</div>;
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

 */