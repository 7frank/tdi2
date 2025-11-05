// Auto-generated transformation snapshot for ImportedInterfaceComponent
// Generated: 2025-08-17T08:21:49.991Z
import React from "react";
import type { ImportedComponentProps } from "./ComponentInterfaces";
import { useService, useOptionalService } from "@tdi2/di-core/context";

/**
 * TODO
 *   "useService as ApiInterface"
 *   needs to be transformed to "as ImportedComponentProps['services']['api'])"
 *   or imported... But then again it might not be exported.
 */
export function ImportedInterfaceComponent(props: ImportedComponentProps) {
    const api = props.services?.api ?? (useService('ApiInterface') as unknown as ApiInterface);
    const logger = props.services?.logger ?? (useOptionalService('LoggerInterface') as unknown as LoggerInterface);
    const { data } = props;
  return (
    <div>
      <p>Data count: {data.length}</p>
      <button
        onClick={() => {
          logger.log("Button clicked");
          api.refreshData();
        }}
      >
        Refresh
      </button>
    </div>
  );
}
