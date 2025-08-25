// Auto-generated transformation snapshot for DynamicDestructuring
// Generated: 2025-08-25T18:16:22.918Z
import React from "react";
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface, LoggerInterface } from "./shared-types";
import { useService, useOptionalService } from "@tdi2/di-core/context";

const DYNAMIC_KEY = "customProp";

export function DynamicDestructuring(
  props: {
    services: {
      logger?: InjectOptional<LoggerInterface>;
    };
    id: string;
    [key: string]: any; // Allow dynamic properties
  }
) {
    const logger = props.services?.logger ?? (useOptionalService('LoggerInterface') as unknown as LoggerInterface);
    const { dynamicValue, id, ...restProps } = props;
  // Dynamic property names with rest parameters - very edge case
  const { 
    [DYNAMIC_KEY]: dynamicValue,
    id,
    ...restProps 
  } = props;

  restProps.services.logger?.log(`Dynamic value: ${dynamicValue}`);

  // Also test destructuring assignment (not in function parameters)
  const { services: serviceProps, ...nonServiceProps } = restProps;
  
  return (
    <div>
      <h1>{id}</h1>
      <p>Dynamic: {dynamicValue || "Not provided"}</p>
      <p>Services available: {serviceProps?.logger ? "Yes" : "No"}</p>
      <p>Other props: {Object.keys(nonServiceProps).join(", ")}</p>
    </div>
  );
}