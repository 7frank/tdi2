// Auto-generated transformation snapshot for DefaultsWithRestAndDI
// Generated: 2025-11-03T09:01:39.061Z
import React from "react";
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface, LoggerInterface } from "./shared-types";
import { useService, useOptionalService } from "@tdi2/di-core/context";

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
    const logger = props.services?.logger ?? (useOptionalService('LoggerInterface') as unknown as LoggerInterface);
    const { isEnabled, timeout, config: { theme, mode }, id, ...restProps } = props;
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