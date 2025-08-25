// Auto-generated transformation snapshot for ComplexPropsSpreading
// Generated: 2025-08-25T10:19:45.330Z
import React from "react";
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface, LoggerInterface } from "./shared-types";
import { useService, useOptionalService } from "@tdi2/di-core/context";

interface BaseProps {
  id: string;
}

export function ComplexPropsSpreading(
  props: BaseProps & {
    services: {
      logger?: InjectOptional<LoggerInterface>;
    };
    onClick?: () => void;
  }
) {
    const logger = props.services?.logger ?? (useOptionalService('LoggerInterface') as unknown as LoggerInterface);
    const { id, onClick, ...restProps } = props;
  restProps.services.logger?.log("logging");

  return <div onClick={onClick}>{id}</div>;
}
