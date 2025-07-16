// Auto-generated transformation snapshot for InlineDestructuredWorking
// Generated: 2025-07-16T12:00:41.388Z
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface } from "./shared-types";
import { useService, useOptionalService } from "@tdi2/di-core/context";

export function InlineDestructuredWorking(props: {
  services: {
    api: Inject<ApiInterface>;
  };
}) {
    const api = props.services.api ?? (useService('ApiInterface') as unknown as ApiInterface);
  return <div>{services.api.getData()}Mixed dependencies component</div>;
}

export function InlineDestructuredFailingA(props: {
      services: {
        api: Inject<ApiInterface>;
      };
    }) {
    const api = props.services.api ?? (useService('ApiInterface') as unknown as ApiInterface);
  return <div>{services.api.getData()}Mixed dependencies component</div>;
}

export function InlineDestructuredFailingB(props: {
      api: Inject<ApiInterface>;
    }) {
    const api = props.api ?? (useService('ApiInterface') as unknown as ApiInterface);
  return <div>{api.getData()}Mixed dependencies component</div>;
}
