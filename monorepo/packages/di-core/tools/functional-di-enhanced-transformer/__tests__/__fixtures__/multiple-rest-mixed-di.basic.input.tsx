import React from "react";
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface, LoggerInterface } from "./shared-types";

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
  // Multiple rest parameters at different levels - very complex case
  const { 
    services: { logger, ...otherServices },
    config: { 
      ui: { theme, ...uiRest }, 
      cache: { ttl, ...cacheRest },
      ...configRest 
    },
    metadata: { version, ...metaRest },
    id,
    ...restProps 
  } = props;

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