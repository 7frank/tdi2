// Auto-generated transformation snapshot for AliasingWithRestAndDI
// Generated: 2025-11-03T09:01:38.748Z
import React from "react";
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface, LoggerInterface } from "./shared-types";
import { useService, useOptionalService } from "@tdi2/di-core/context";

export function AliasingWithRestAndDI(
  props: {
    services: {
      logger?: InjectOptional<LoggerInterface>;
      api: Inject<ApiInterface>;
    };
    id: string;
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
  }
) {
    const logger = props.services?.logger ?? (useOptionalService('LoggerInterface') as unknown as LoggerInterface);
    const api = props.services?.api ?? (useService('ApiInterface') as unknown as ApiInterface);
    const { id: itemId, onClick: handleClick, className: cssClass, ...restProps } = props;
  // Complex aliasing with rest parameters - potential edge case
  loggerService?.log(`Item ${itemId} clicked`);
  apiService.getData();

  return (
    <button 
      className={cssClass} 
      onClick={handleClick} 
      disabled={restProps.disabled}
    >
      {itemId}
    </button>
  );
}