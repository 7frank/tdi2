import React from "react";
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface, LoggerInterface } from "./shared-types";

export function DefaultsWithRestAndDI(
  props: {
    services: {
      logger?: InjectOptional<LoggerInterface>;
    };
    config?: {
      theme?: string;
      mode?: string;
    };
    isEnabled?: boolean;
    timeout?: number;
    id: string;
  }
) {
  // Default values combined with rest parameters - potential parsing issues
  const { 
    isEnabled = true, 
    timeout = 5000,
    config: { theme = "dark", mode = "auto" } = {},
    id,
    ...restProps 
  } = props;

  restProps.services.logger?.log(
    `Config: enabled=${isEnabled}, timeout=${timeout}, theme=${theme}, mode=${mode}`
  );

  return (
    <div data-theme={theme} data-mode={mode}>
      <h1>{id}</h1>
      <p>Enabled: {isEnabled ? "Yes" : "No"}</p>
      <p>Timeout: {timeout}ms</p>
      <p>Has rest props: {Object.keys(restProps).length > 0 ? "Yes" : "No"}</p>
    </div>
  );
}