// Auto-generated transformation snapshot for FirstComponent
// Generated: 2025-08-24T22:03:37.578Z
import type { Inject } from "@tdi2/di-core/markers";
import { ApiInterface, LoggerInterface } from "./shared-types";
import { useService, useOptionalService } from "@tdi2/di-core/context";

export function FirstComponent(props: {
  services: {
    api: Inject<ApiInterface>;
  };
}) {
    const api = props.services?.api ?? (useService('ApiInterface') as unknown as ApiInterface);
  return <div>First: {props.services.api.getData()}</div>;
}

export const SecondComponent = (props: {
  services: {
    logger: Inject<LoggerInterface>;
  };
}) => {
    const logger = props.services?.logger ?? (useService('LoggerInterface') as unknown as LoggerInterface);
  logger.log("");

  return <div>Second component</div>;
};

// This should be ignored (no DI markers)
export function ThirdComponent(props: { message: string }) {
  return <div>{props.message}</div>;
}
