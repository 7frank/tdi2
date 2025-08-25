import React from "react";
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface, LoggerInterface } from "./shared-types";

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
  // Complex aliasing with rest parameters - potential edge case
  const { 
    id: itemId, 
    onClick: handleClick, 
    className: cssClass = "default",
    services: { logger: loggerService, api: apiService },
    ...restProps 
  } = props;

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