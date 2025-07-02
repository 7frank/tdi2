/*
 * TDI2 Functional DI - Transformed File
 * =====================================
 * 
 * Original: ../../../../../../../../../src/components/SeparateInterfaceArrow.tsx
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
import type { SimpleComponentProps } from './ComponentInterfaces';
import { useService, useOptionalService } from "@tdi2/di-core/context";

export const SeparateInterfaceArrow = (props: SimpleComponentProps) => {
                const api = useService('ExampleApiInterface');
                const services = { api };
  const { title } = props;
  
  return <div>Arrow with separate interface: {title}</div>;
};
  

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