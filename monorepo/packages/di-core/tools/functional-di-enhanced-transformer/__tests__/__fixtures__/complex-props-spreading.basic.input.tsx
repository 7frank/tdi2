import React from "react";
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface, LoggerInterface } from "./shared-types";

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
  const { id, onClick, ...restProps } = props;

  restProps.services.logger?.log("logging");

  return <div onClick={onClick}>{id}</div>;
}
