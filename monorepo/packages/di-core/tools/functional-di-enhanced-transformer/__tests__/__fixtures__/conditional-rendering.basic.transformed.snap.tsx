// Auto-generated transformation snapshot for ConditionalRendering
// Generated: 2025-08-24T22:03:37.384Z
import type { InjectOptional } from "@tdi2/di-core/markers";
import { LoggerInterface } from "./shared-types";
import { useService, useOptionalService } from "@tdi2/di-core/context";

export function ConditionalRendering(props: {
  isEnabled: boolean;
  services: {
    logger?: InjectOptional<LoggerInterface>;
  };
}) {
    const logger = props.services?.logger ?? (useOptionalService('LoggerInterface') as unknown as LoggerInterface);
    const { isEnabled } = props;
  if (!isEnabled) {
    return <div>Feature disabled</div>;
  }

  return (
    <div>
      {logger && (
        <button onClick={() => logger.log("Button clicked")}>
          Log Click
        </button>
      )}
    </div>
  );
}
