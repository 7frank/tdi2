// Auto-generated transformation snapshot for MultipleRestMixedDI
// Generated: 2025-11-03T09:01:38.906Z
import React from "react";
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface, LoggerInterface } from "./shared-types";
import { useService, useOptionalService } from "@tdi2/di-core/context";

export function MultipleRestMixedDI(
  props: {
    services: {
      logger?: InjectOptional<LoggerInterface>;
    };
    config: {
      ui: { theme: string; mode: string; };
      cache: { ttl: number; maxSize: number; };
    };
    metadata: {
      version: string;
      author: string;
    };
    id: string;
  }
) {
    const logger = props.services?.logger ?? (useOptionalService('LoggerInterface') as unknown as LoggerInterface);
    const { config: { ui: { theme, uiRest }, cache: { ttl, cacheRest }, configRest }, metadata: { version, metaRest }, id, ...restProps } = props;
  // Multiple rest parameters at different levels - very complex case
  logger?.log(`Version: ${version}, Theme: ${theme}, TTL: ${ttl}`);

  return (
    <div>
      <h1>{id} v{version}</h1>
      <p>Theme: {theme}</p>
      <p>Cache TTL: {ttl}</p>
      <div>Other services: {JSON.stringify(otherServices)}</div>
      <div>UI Rest: {JSON.stringify(uiRest)}</div>
      <div>Cache Rest: {JSON.stringify(cacheRest)}</div>
      <div>Config Rest: {JSON.stringify(configRest)}</div>
      <div>Meta Rest: {JSON.stringify(metaRest)}</div>
      <div>Rest Props: {JSON.stringify(restProps)}</div>
    </div>
  );
}