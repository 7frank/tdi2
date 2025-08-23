// Auto-generated transformation snapshot for ImportedInterfaceComponent
// Generated: 2025-08-23T23:14:14.399Z
import React from "react";
import type { ImportedComponentProps } from "./ComponentInterfaces";

/**
 * TODO
 *   "useService as ApiInterface"
 *   needs to be transformed to "as ImportedComponentProps['services']['api'])"
 *   or imported... But then again it might not be exported.
 */
export function ImportedInterfaceComponent(props: ImportedComponentProps) {
  const { data, services } = props;

  return (
    <div>
      <p>Data count: {data.length}</p>
      <button
        onClick={() => {
          services.logger?.log("Button clicked");
          services.api.refreshData();
        }}
      >
        Refresh
      </button>
    </div>
  );
}
