import React from "react";
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface, LoggerInterface } from "./shared-types";

interface NestedConfig {
  theme: string;
  colors: string[];
  apiUrl: string;
}

export function NestedDestructuringWithRest(
  props: {
    services: {
      logger?: InjectOptional<LoggerInterface>;
    };
    config: {
      ui: { theme: string; colors: string[]; fontSize?: number; };
      api: { baseUrl: string; timeout: number; retries?: number; };
    };
    id: string;
    onClick?: () => void;
  }
) {
  // Multi-level nested destructuring with rest parameters
  const { 
    config: { 
      ui: { theme, colors, ...uiRest }, 
      api: { baseUrl, ...apiRest } 
    }, 
    id, 
    ...restProps 
  } = props;

  restProps.services.logger?.log(`Theme: ${theme}, Base URL: ${baseUrl}`);

  return (
    <div onClick={restProps.onClick}>
      <h1>{id}</h1>
      <p>Theme: {theme}</p>
      <p>Colors: {colors.join(', ')}</p>
      <p>Base URL: {baseUrl}</p>
    </div>
  );
}