// Auto-generated transformation snapshot for ImportedInterfaceComponent
// Generated: 2025-07-18T10:23:49.171Z
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
    const api = props.services?.api; if (!api) {throw new Error("Could not find implementation for 'ApiInterface'");}
    const { data } = props;
    const logger = props.services?.logger; if (!logger) {throw new Error("Could not find implementation for 'LoggerInterface'");}
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
