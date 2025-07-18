import type { InjectOptional } from "@tdi2/di-core/markers";
import { LoggerInterface } from "./shared-types";

export function ConditionalRendering(props: {
  isEnabled: boolean;
  services: {
    logger?: InjectOptional<LoggerInterface>;
  };
}) {
  const { isEnabled, services } = props;

  if (!isEnabled) {
    return <div>Feature disabled</div>;
  }

  return (
    <div>
      {services.logger && (
        <button onClick={() => services.logger?.log("Button clicked")}>
          Log Click
        </button>
      )}
    </div>
  );
}
