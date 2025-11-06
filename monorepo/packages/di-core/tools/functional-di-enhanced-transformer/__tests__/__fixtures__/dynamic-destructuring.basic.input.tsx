import React from "react";
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface, LoggerInterface } from "./shared-types";

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